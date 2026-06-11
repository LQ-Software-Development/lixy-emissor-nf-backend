import { Controller, Get, Param, Patch, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedRequest } from '../../common/types/authenticated-request';
import { FiscalDashboardDto } from './dto/fiscal-dashboard.dto';
import {
  FiscalObligationDto,
  PayObligationResponseDto,
} from './dto/fiscal-obligation.dto';
import { FiscalDashboardService } from './fiscal-dashboard.service';
import { ListObligationsService } from './list-obligations.service';
import { PayObligationService } from './pay-obligation.service';

@ApiTags('Fiscal')
@ApiBearerAuth()
@ApiHeader({ name: 'x-company-id', required: false })
@Controller('fiscal')
export class FiscalController {
  constructor(
    private readonly fiscalDashboardService: FiscalDashboardService,
    private readonly listObligationsService: ListObligationsService,
    private readonly payObligationService: PayObligationService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard fiscal com indicadores MEI' })
  getDashboard(@Req() req: AuthenticatedRequest): Promise<FiscalDashboardDto> {
    return this.fiscalDashboardService.execute(req.companyId);
  }

  @Get('obligations')
  @ApiOperation({ summary: 'Listar obrigações fiscais (DAS/DASN)' })
  listObligations(
    @Req() req: AuthenticatedRequest,
  ): Promise<FiscalObligationDto[]> {
    return this.listObligationsService.execute(req.companyId);
  }

  @Patch('obligations/:id/pay')
  @ApiOperation({ summary: 'Marcar obrigação como paga' })
  payObligation(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ): Promise<PayObligationResponseDto> {
    return this.payObligationService.execute(req.companyId, id);
  }
}
