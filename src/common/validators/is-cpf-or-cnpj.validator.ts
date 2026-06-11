import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidCnpj } from './is-cnpj.validator';
import { isValidCpf } from './is-cpf.validator';

export function isValidCpfOrCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) {
    return isValidCpf(value);
  }
  if (digits.length === 14) {
    return isValidCnpj(value);
  }
  return false;
}

export function normalizeDocument(value: string): string {
  return value.replace(/\D/g, '');
}

export type DocumentType = 'cpf' | 'cnpj';

export function resolveDocumentType(value: string): DocumentType {
  const digits = normalizeDocument(value);
  return digits.length === 14 ? 'cnpj' : 'cpf';
}

@ValidatorConstraint({ name: 'isCpfOrCnpj', async: false })
export class IsCpfOrCnpjConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && isValidCpfOrCnpj(value);
  }

  defaultMessage(): string {
    return 'CPF ou CNPJ inválido';
  }
}

export function IsCpfOrCnpj(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCpfOrCnpjConstraint,
    });
  };
}
