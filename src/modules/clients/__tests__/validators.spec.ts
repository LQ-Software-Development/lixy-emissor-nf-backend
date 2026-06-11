import { isValidCnpj } from '../validators/cnpj.validator';
import { isValidCpf } from '../validators/cpf.validator';
import {
  getDocumentType,
  IsDocumentConstraint,
  isValidDocument,
} from '../validators/document.validator';

describe('CPF Validator', () => {
  it('accepts valid CPF 52998224725', () => {
    expect(isValidCpf('52998224725')).toBe(true);
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it('rejects invalid CPF sequences', () => {
    expect(isValidCpf('00000000000')).toBe(false);
    expect(isValidCpf('11111111111')).toBe(false);
    expect(isValidCpf('12345678901')).toBe(false);
  });

  it('rejects CPF with wrong length', () => {
    expect(isValidCpf('123456789')).toBe(false);
  });
});

describe('CNPJ Validator', () => {
  it('accepts valid CNPJ 11222333000181', () => {
    expect(isValidCnpj('11222333000181')).toBe(true);
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
  });

  it('rejects invalid CNPJ sequences', () => {
    expect(isValidCnpj('00000000000000')).toBe(false);
    expect(isValidCnpj('11111111111111')).toBe(false);
  });

  it('rejects CNPJ with wrong length', () => {
    expect(isValidCnpj('1234567890123')).toBe(false);
  });
});

describe('Document Validator', () => {
  it('validates CPF and CNPJ documents', () => {
    expect(isValidDocument('52998224725')).toBe(true);
    expect(isValidDocument('11222333000181')).toBe(true);
    expect(isValidDocument('00000000000')).toBe(false);
  });

  it('detects document type', () => {
    expect(getDocumentType('52998224725')).toBe('PF');
    expect(getDocumentType('11222333000181')).toBe('PJ');
    expect(getDocumentType('00000000000')).toBeNull();
  });

  it('rejects invalid document length', () => {
    expect(isValidDocument('123')).toBe(false);
    expect(getDocumentType('123')).toBeNull();
  });
});

describe('IsDocumentConstraint', () => {
  const constraint = new IsDocumentConstraint();

  it('validates string documents', () => {
    expect(constraint.validate('52998224725')).toBe(true);
    expect(constraint.validate(123)).toBe(false);
  });

  it('returns default error message', () => {
    expect(constraint.defaultMessage({ property: 'document' } as never)).toBe(
      'document must be a valid CPF or CNPJ',
    );
  });
});
