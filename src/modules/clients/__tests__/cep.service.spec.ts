import { BadGatewayException } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { CepService } from '../services/cep.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CepService', () => {
  let service: CepService;

  beforeEach(() => {
    service = new CepService();
    jest.clearAllMocks();
  });

  it('returns address for valid CEP', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        cep: '01310-100',
        logradouro: 'Avenida Paulista',
        complemento: '',
        bairro: 'Bela Vista',
        localidade: 'São Paulo',
        uf: 'SP',
      },
    });

    await expect(service.lookup('01310100')).resolves.toEqual({
      zipCode: '01310100',
      street: 'Avenida Paulista',
      complement: null,
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    });
  });

  it('returns null for invalid CEP', async () => {
    await expect(service.lookup('123')).resolves.toBeNull();

    mockedAxios.get.mockResolvedValue({ data: { erro: true } });
    await expect(service.lookup('99999999')).resolves.toBeNull();
  });

  it('throws BadGatewayException on ViaCEP error', async () => {
    const axiosError = new AxiosError('Network Error');
    mockedAxios.get.mockRejectedValue(axiosError);

    await expect(service.lookup('01310100')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('rethrows non-axios errors', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Unexpected'));

    await expect(service.lookup('01310100')).rejects.toThrow('Unexpected');
  });
});
