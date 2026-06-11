import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidCnpj } from './cnpj.validator';
import { isValidCpf, stripNonDigits } from './cpf.validator';

export { stripNonDigits };

export function isValidDocument(document: string): boolean {
  const cleaned = stripNonDigits(document);

  if (cleaned.length === 11) {
    return isValidCpf(cleaned);
  }

  if (cleaned.length === 14) {
    return isValidCnpj(cleaned);
  }

  return false;
}

export function getDocumentType(document: string): 'PF' | 'PJ' | null {
  const cleaned = stripNonDigits(document);

  if (cleaned.length === 11 && isValidCpf(cleaned)) {
    return 'PF';
  }

  if (cleaned.length === 14 && isValidCnpj(cleaned)) {
    return 'PJ';
  }

  return null;
}

@ValidatorConstraint({ name: 'isDocument', async: false })
export class IsDocumentConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    return isValidDocument(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid CPF or CNPJ`;
  }
}

export function IsDocument(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsDocumentConstraint,
    });
  };
}
