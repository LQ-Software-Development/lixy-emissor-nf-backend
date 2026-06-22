import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumberString,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';

export class CreateNfeInvoiceDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  clientId!: string;

  @ApiProperty({
    example: 'Serviço de consultoria',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  description!: string;

  @ApiProperty({ example: '150.00' })
  @IsNumberString()
  @Matches(/^(?!0+(\.0+)?$)\d+(\.\d{1,2})?$/, {
    message: 'amount must be greater than 0',
  })
  amount!: string;
}
