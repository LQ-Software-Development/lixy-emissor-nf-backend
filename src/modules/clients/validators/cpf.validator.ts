export function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function isRepeatedDigits(value: string): boolean {
  return /^(\d)\1+$/.test(value);
}

function calculateCpfDigit(digits: string, factor: number): number {
  let sum = 0;

  for (let i = 0; i < digits.length; i += 1) {
    sum += Number(digits[i]) * (factor - i);
  }

  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCpf(cpf: string): boolean {
  const cleaned = stripNonDigits(cpf);

  if (cleaned.length !== 11) {
    return false;
  }

  if (isRepeatedDigits(cleaned)) {
    return false;
  }

  const firstDigit = calculateCpfDigit(cleaned.slice(0, 9), 10);
  const secondDigit = calculateCpfDigit(cleaned.slice(0, 10), 11);

  return (
    firstDigit === Number(cleaned[9]) && secondDigit === Number(cleaned[10])
  );
}
