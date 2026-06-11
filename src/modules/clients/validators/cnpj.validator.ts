import { isRepeatedDigits, stripNonDigits } from './cpf.validator';

const CNPJ_WEIGHTS_FIRST = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const CNPJ_WEIGHTS_SECOND = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function calculateCnpjDigit(digits: string, weights: number[]): number {
  let sum = 0;

  for (let i = 0; i < weights.length; i += 1) {
    sum += Number(digits[i]) * weights[i];
  }

  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCnpj(cnpj: string): boolean {
  const cleaned = stripNonDigits(cnpj);

  if (cleaned.length !== 14) {
    return false;
  }

  if (isRepeatedDigits(cleaned)) {
    return false;
  }

  const firstDigit = calculateCnpjDigit(
    cleaned.slice(0, 12),
    CNPJ_WEIGHTS_FIRST,
  );
  const secondDigit = calculateCnpjDigit(
    cleaned.slice(0, 13),
    CNPJ_WEIGHTS_SECOND,
  );

  return (
    firstDigit === Number(cleaned[12]) && secondDigit === Number(cleaned[13])
  );
}
