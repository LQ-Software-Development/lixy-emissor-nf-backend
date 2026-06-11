import { validate } from 'class-validator';
import { IsCep, isValidCep, normalizeCep } from './is-cep.validator';

class CepDto {
  @IsCep()
  cep!: string;
}

describe('isValidCep', () => {
  it('accepts formatted CEP', () => {
    expect(isValidCep('01310-100')).toBe(true);
  });

  it('accepts unformatted CEP', () => {
    expect(isValidCep('01310100')).toBe(true);
  });

  it('rejects invalid length', () => {
    expect(isValidCep('123')).toBe(false);
  });

  it('rejects all zeros', () => {
    expect(isValidCep('00000-000')).toBe(false);
  });
});

describe('normalizeCep', () => {
  it('removes formatting', () => {
    expect(normalizeCep('01310-100')).toBe('01310100');
  });
});

describe('IsCep decorator', () => {
  it('validates DTO property', async () => {
    const dto = new CepDto();
    dto.cep = '01310-100';

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
