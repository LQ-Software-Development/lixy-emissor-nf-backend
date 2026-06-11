import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus } from '../entities/invoice.entity';

export class InvoiceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  clientId!: string | null;

  @ApiProperty({ example: 'NF-2026-000001' })
  number!: string;

  @ApiProperty({ example: 150.5 })
  amount!: number;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: InvoiceStatus })
  status!: InvoiceStatus;

  @ApiProperty()
  issuedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  cancelledAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class PaginatedInvoicesResponseDto {
  @ApiProperty({ type: [InvoiceResponseDto] })
  data!: InvoiceResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}
