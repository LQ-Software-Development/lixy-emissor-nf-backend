import { Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FiscalDashboardDto } from './dto/fiscal-dashboard.dto';
import { FiscalObligationDto } from './dto/fiscal-obligation.dto';
import { FiscalService } from './fiscal.service';

@ApiTags('Fiscal')
@ApiBearerAuth()
@Controller('fiscal')
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Fiscal dashboard with key MEI metrics' })
  getDashboard(): Promise<FiscalDashboardDto> {
    return this.fiscalService.getDashboard();
  }

  @Get('obligations')
  @ApiOperation({ summary: 'List fiscal obligations (DAS/DASN)' })
  getObligations(): Promise<FiscalObligationDto[]> {
    return this.fiscalService.getObligations();
  }

  @Patch('obligations/:id/pay')
  @ApiOperation({ summary: 'Mark a fiscal obligation as paid' })
  markAsPaid(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FiscalObligationDto> {
    return this.fiscalService.markAsPaid(id);
  }
}
