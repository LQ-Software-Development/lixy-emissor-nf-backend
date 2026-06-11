import { validate } from 'class-validator';
import {
  IsCpfOrCnpj,
  isValidCpfOrCnpj,
  normalizeDocument,
  resolveDocumentType,
} from './is-cpf-or-cnpj.validator';

class DocumentDto {
  @IsCpfOrCnpj()
  document!: string;
}

describe('isValidCpfOrCnpj', () => {
  it('accepts valid CPF', () => {
    expect(isValidCpfOrCnpj('529.982.247-25')).toBe(true);
  });

  it('accepts valid CNPJ', () => {
    expect(isValidCpfOrCnpj('11.444.777/0001-61')).toBe(true);
  });

  it('rejects invalid document', () => {
    expect(isValidCpfOrCnpj('123')).toBe(false);
  });
});

describe('normalizeDocument', () => {
  it('strips formatting', () => {
    expect(normalizeDocument('529.982.247-25')).toBe('52998224725');
  });
});

describe('resolveDocumentType', () => {
  it('returns cpf for 11 digits', () => {
    expect(resolveDocumentType('529.982.247-25')).toBe('cpf');
  });

  it('returns cnpj for 14 digits', () => {
    expect(resolveDocumentType('11.444.777/0001-61')).toBe('cnpj');
  });
});

describe('IsCpfOrCnpj decorator', () => {
  it('validates CPF in DTO', async () => {
    const dto = new DocumentDto();
    dto.document = '529.982.247-25';

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('validates CNPJ in DTO', async () => {
    const dto = new DocumentDto();
    dto.document = '11.444.777/0001-61';

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
