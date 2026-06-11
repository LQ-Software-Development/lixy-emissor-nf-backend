import { ApiProperty } from '@nestjs/swagger';

export class NextDasDto {
  @ApiProperty({ example: '2026-06-20', nullable: true })
  dueDate!: string | null;

  @ApiProperty({ example: 75.9, nullable: true })
  amount!: number | null;

  @ApiProperty({ example: 9, nullable: true })
  daysRemaining!: number | null;
}

export class FiscalDashboardDto {
  @ApiProperty({ example: 12500.5, description: 'Faturamento do mês corrente' })
  monthlyRevenue!: number;

  @ApiProperty({ example: 81000, description: 'Limite anual MEI' })
  meiAnnualLimit!: number;

  @ApiProperty({ example: 45200, description: 'Faturamento acumulado no ano' })
  annualRevenue!: number;

  @ApiProperty({ type: NextDasDto })
  nextDas!: NextDasDto;

  @ApiProperty({ example: 42, description: 'Total de notas fiscais emitidas' })
  totalInvoices!: number;
}
