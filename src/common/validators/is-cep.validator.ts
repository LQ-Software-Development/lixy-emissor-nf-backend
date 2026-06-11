import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export function normalizeCep(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidCep(value: string): boolean {
  const digits = normalizeCep(value);
  return digits.length === 8 && digits !== '00000000';
}

@ValidatorConstraint({ name: 'isCep', async: false })
export class IsCepConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && isValidCep(value);
  }

  defaultMessage(): string {
    return 'CEP inválido';
  }
}

export function IsCep(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCepConstraint,
    });
  };
}
