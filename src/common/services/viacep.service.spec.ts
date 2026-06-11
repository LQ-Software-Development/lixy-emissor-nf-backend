import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { ViaCepService } from './viacep.service';

describe('ViaCepService', () => {
  let service: ViaCepService;
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    service = new ViaCepService();
  });

  it('returns normalized address on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        complemento: '',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
      }),
    }) as unknown as typeof fetch;

    await expect(service.lookup('01310-100')).resolves.toEqual({
      cep: '01310100',
      street: 'Avenida Paulista',
      complement: '',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    });
  });

  it('throws NotFoundException when CEP is unknown', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ erro: true }),
    }) as unknown as typeof fetch;

    await expect(service.lookup('99999-999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws BadGatewayException when ViaCEP is unavailable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch;

    await expect(service.lookup('01310-100')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('throws BadGatewayException when ViaCEP returns non-ok status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    await expect(service.lookup('01310-100')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
