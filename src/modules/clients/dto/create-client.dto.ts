import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { IsDocument } from '../validators/document.validator';

export class CreateClientDto {
  @ApiProperty({ example: 'João da Silva' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '52998224725', description: 'CPF or CNPJ' })
  @IsString()
  @IsNotEmpty()
  @IsDocument()
  document!: string;

  @ApiPropertyOptional({ example: 'joao@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '11999999999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '01310100' })
  @IsString()
  @Matches(/^\d{8}$/, { message: 'zipCode must contain 8 digits' })
  zipCode!: string;

  @ApiPropertyOptional({ example: 'Avenida Paulista' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({ example: '1000' })
  @IsString()
  @IsNotEmpty()
  number!: string;

  @ApiPropertyOptional({ example: 'Sala 10' })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiPropertyOptional({ example: 'Bela Vista' })
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  state?: string;
}
