import { validate } from 'class-validator';
import { IsCnpj, isValidCnpj, normalizeCnpj } from './is-cnpj.validator';

class CnpjDto {
  @IsCnpj()
  cnpj!: string;
}

describe('isValidCnpj', () => {
  it('accepts a valid formatted CNPJ', () => {
    expect(isValidCnpj('11.444.777/0001-61')).toBe(true);
  });

  it('accepts a valid unformatted CNPJ', () => {
    expect(isValidCnpj('11444777000161')).toBe(true);
  });

  it('rejects CNPJ with invalid check digits', () => {
    expect(isValidCnpj('11.444.777/0001-00')).toBe(false);
  });

  it('rejects CNPJ with repeated digits', () => {
    expect(isValidCnpj('11.111.111/1111-11')).toBe(false);
  });

  it('rejects CNPJ with wrong length', () => {
    expect(isValidCnpj('123')).toBe(false);
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

  it('rejects invalid DTO property', async () => {
    const dto = new CnpjDto();
    dto.cnpj = 'invalid';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isCnpj).toBe('CNPJ inválido');
  });
});
