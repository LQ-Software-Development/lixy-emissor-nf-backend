import { ApiProperty } from '@nestjs/swagger';
import {
  ObligationStatus,
  ObligationType,
} from '../entities/fiscal-obligation.entity';

export class FiscalObligationDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ObligationType })
  type!: ObligationType;

  @ApiProperty({ example: '2026-05' })
  referencePeriod!: string;

  @ApiProperty({ example: '2026-06-20' })
  dueDate!: string;

  @ApiProperty({ example: 75.9 })
  amount!: number;

  @ApiProperty({ enum: ObligationStatus })
  status!: ObligationStatus;

  @ApiProperty({ example: '2026-06-15', nullable: true })
  paidAt!: string | null;
}
