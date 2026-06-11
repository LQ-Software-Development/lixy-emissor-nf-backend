import { validate } from 'class-validator';
import {
  IsBrazilianPhone,
  isValidBrazilianPhone,
  stripPhoneDigits,
} from './is-brazilian-phone.validator';

class PhoneDto {
  @IsBrazilianPhone()
  phone!: string;
}

describe('isValidBrazilianPhone', () => {
  it('accepts mobile with area code', () => {
    expect(isValidBrazilianPhone('(11) 98765-4321')).toBe(true);
  });

  it('accepts landline with area code', () => {
    expect(isValidBrazilianPhone('(11) 3456-7890')).toBe(true);
  });

  it('accepts number with country code', () => {
    expect(isValidBrazilianPhone('+55 11 98765-4321')).toBe(true);
  });

  it('rejects invalid area code', () => {
    expect(isValidBrazilianPhone('(00) 98765-4321')).toBe(false);
  });

  it('rejects 11-digit number without mobile ninth digit', () => {
    expect(isValidBrazilianPhone('(11) 87654-3210')).toBe(false);
  });
});

describe('stripPhoneDigits', () => {
  it('removes formatting', () => {
    expect(stripPhoneDigits('(11) 98765-4321')).toBe('11987654321');
  });
});

describe('IsBrazilianPhone decorator', () => {
  it('validates DTO property', async () => {
    const dto = new PhoneDto();
    dto.phone = '(11) 98765-4321';

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
