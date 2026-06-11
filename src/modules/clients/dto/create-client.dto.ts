import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { IsBrazilianPhone } from '../../../common/validators/is-brazilian-phone.validator';
import { IsCep } from '../../../common/validators/is-cep.validator';
import { IsCpfOrCnpj } from '../../../common/validators/is-cpf-or-cnpj.validator';

export class CreateClientDto {
  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: '390.533.447-05', description: 'CPF ou CNPJ' })
  @IsCpfOrCnpj()
  document!: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '(11) 98765-4321' })
  @IsOptional()
  @IsBrazilianPhone()
  phone?: string;

  @ApiProperty({ example: '01310-100' })
  @IsCep()
  cep!: string;

  @ApiProperty({ example: 'Avenida Paulista' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  street!: string;

  @ApiPropertyOptional({ example: '1000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  number?: string;

  @ApiPropertyOptional({ example: 'Sala 12' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  complement?: string;

  @ApiProperty({ example: 'Bela Vista' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  neighborhood!: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  city!: string;

  @ApiProperty({ example: 'SP' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  state!: string;
}
