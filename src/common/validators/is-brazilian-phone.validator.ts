import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export function stripPhoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidBrazilianPhone(value: string): boolean {
  const digits = stripPhoneDigits(value);

  if (digits.length === 10 || digits.length === 11) {
    const areaCode = Number(digits.slice(0, 2));
    if (areaCode < 11 || areaCode > 99) {
      return false;
    }
    if (digits.length === 11 && digits[2] !== '9') {
      return false;
    }
    return true;
  }

  if (digits.length === 12 || digits.length === 13) {
    if (!digits.startsWith('55')) {
      return false;
    }
    return isValidBrazilianPhone(digits.slice(2));
  }

  return false;
}

@ValidatorConstraint({ name: 'isBrazilianPhone', async: false })
export class IsBrazilianPhoneConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown): boolean {
    return typeof value === 'string' && isValidBrazilianPhone(value);
  }

  defaultMessage(): string {
    return 'Telefone brasileiro inválido';
  }
}

export function IsBrazilianPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsBrazilianPhoneConstraint,
    });
  };
}
