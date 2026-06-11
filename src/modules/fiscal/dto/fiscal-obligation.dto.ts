import { ApiProperty } from '@nestjs/swagger';
import {
  FiscalObligationStatus,
  FiscalObligationType,
} from '../entities/fiscal-obligation.entity';

export class FiscalObligationDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: FiscalObligationType })
  type: FiscalObligationType;

  @ApiProperty({ example: '2026-05' })
  referencePeriod: string;

  @ApiProperty({ example: '2026-06-20' })
  dueDate: string;

  @ApiProperty({ example: 75.9 })
  amount: number;

  @ApiProperty({ enum: FiscalObligationStatus })
  status: FiscalObligationStatus;

  @ApiProperty({ nullable: true })
  paidAt: string | null;
}

export class PayObligationResponseDto {
  @ApiProperty({ type: FiscalObligationDto })
  obligation: FiscalObligationDto;
}
