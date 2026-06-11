import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

function stripDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function allSameDigits(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

function calculateCpfCheckDigit(digits: string, factor: number): number {
  const sum = digits
    .slice(0, factor - 1)
    .split('')
    .reduce((acc, digit, index) => acc + Number(digit) * (factor - index), 0);
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

export function isValidCpf(value: string): boolean {
  const digits = stripDigits(value);

  if (digits.length !== 11 || allSameDigits(digits)) {
    return false;
  }

  const firstCheck = calculateCpfCheckDigit(digits, 10);
  const secondCheck = calculateCpfCheckDigit(digits, 11);

  return (
    firstCheck === Number(digits[9]) && secondCheck === Number(digits[10])
  );
}

@ValidatorConstraint({ name: 'isCpf', async: false })
export class IsCpfConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return typeof value === 'string' && isValidCpf(value);
  }

  defaultMessage(): string {
    return 'CPF inválido';
  }
}

export function IsCpf(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCpfConstraint,
    });
  };
}

export function normalizeCpf(value: string): string {
  return stripDigits(value);
}
