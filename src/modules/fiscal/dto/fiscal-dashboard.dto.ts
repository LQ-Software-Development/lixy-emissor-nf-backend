import { ApiProperty } from '@nestjs/swagger';

export class NextDasDto {
  @ApiProperty({ example: '2026-06-20' })
  dueDate: string;

  @ApiProperty({ example: 75.9 })
  amount: number;

  @ApiProperty({ example: 9 })
  daysRemaining: number;
}

export class FiscalDashboardDto {
  @ApiProperty({ example: 12500.5, description: 'Faturamento do mês corrente' })
  monthlyRevenue: number;

  @ApiProperty({ example: 81000, description: 'Limite anual MEI' })
  meiAnnualLimit: number;

  @ApiProperty({ example: 45200.75, description: 'Faturamento acumulado no ano' })
  annualRevenue: number;

  @ApiProperty({ type: NextDasDto, nullable: true })
  nextDas: NextDasDto | null;

  @ApiProperty({ example: 42, description: 'Total de NFs emitidas' })
  totalNfsEmitted: number;
}
