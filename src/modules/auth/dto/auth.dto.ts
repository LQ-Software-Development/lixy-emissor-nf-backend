import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { IsCnpj } from '../validators/is-cnpj.validator';

export class RegisterDto {
  @ApiProperty({ example: '12.345.678/0001-95' })
  @IsCnpj()
  cnpj!: string;

  @ApiProperty({ example: 'contato@mei.com.br' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Minha Empresa MEI' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'SenhaSegura123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ example: '12.345.678/0001-95' })
  @IsCnpj()
  cnpj!: string;

  @ApiProperty({ example: 'SenhaSegura123!' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({ example: 900 })
  expiresIn!: number;
}

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  cnpj!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;

  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto;
}
