import { validate } from 'class-validator';
import {
  IsCnpj,
  isValidCnpj,
  normalizeCnpj,
} from '../validators/is-cnpj.validator';

class CnpjDto {
  @IsCnpj()
  cnpj!: string;
}

describe('isValidCnpj', () => {
  it('accepts a valid formatted CNPJ', () => {
    expect(isValidCnpj('11.444.777/0001-61')).toBe(true);
  });

  it('rejects CNPJ with invalid check digits', () => {
    expect(isValidCnpj('11.444.777/0001-00')).toBe(false);
  });
});

describe('normalizeCnpj', () => {
  it('removes non-digit characters', () => {
    expect(normalizeCnpj('11.444.777/0001-61')).toBe('11444777000161');
  });
});

describe('IsCnpj decorator', () => {
  it('validates DTO property', async () => {
    const dto = new CnpjDto();
    dto.cnpj = '11.444.777/0001-61';

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
