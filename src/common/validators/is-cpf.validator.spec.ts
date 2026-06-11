import { validate } from 'class-validator';
import { IsCpf, isValidCpf, normalizeCpf } from './is-cpf.validator';

class CpfDto {
  @IsCpf()
  cpf!: string;
}

describe('isValidCpf', () => {
  it('accepts a valid formatted CPF', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
  });

  it('accepts a valid unformatted CPF', () => {
    expect(isValidCpf('52998224725')).toBe(true);
  });

  it('rejects CPF with invalid check digits', () => {
    expect(isValidCpf('529.982.247-00')).toBe(false);
  });

  it('rejects CPF with repeated digits', () => {
    expect(isValidCpf('111.111.111-11')).toBe(false);
  });

  it('rejects CPF with wrong length', () => {
    expect(isValidCpf('123')).toBe(false);
  });
});

describe('normalizeCpf', () => {
  it('removes non-digit characters', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
  });
});

describe('IsCpf decorator', () => {
  it('validates DTO property', async () => {
    const dto = new CpfDto();
    dto.cpf = '529.982.247-25';

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid DTO property', async () => {
    const dto = new CpfDto();
    dto.cpf = 'invalid';

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints?.isCpf).toBe('CPF inválido');
  });
});
