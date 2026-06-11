import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class CreateNfeInvoiceDto {
  @ApiProperty({ example: '000000001' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 9)
  number!: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  @Length(1, 3)
  series?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiProperty({ example: '150.00' })
  @IsNumberString()
  amount!: string;
}

export class IssueNfeInvoiceDto {
  @ApiProperty({ example: '35260611234567890123456789012345678901234567' })
  @IsString()
  @Matches(/^\d{44}$/, { message: 'accessKey must contain 44 digits' })
  accessKey!: string;
}
