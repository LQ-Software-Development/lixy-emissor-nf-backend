import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({ example: 150.5, description: 'Invoice amount in BRL' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ format: 'uuid', description: 'Linked client ID' })
  @IsOptional()
  @IsUUID()
  clientId?: string;

  @ApiPropertyOptional({ example: 'Serviço de consultoria' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description?: string;
}
