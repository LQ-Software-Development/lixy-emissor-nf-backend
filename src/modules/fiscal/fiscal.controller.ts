import { Controller, Get, Headers } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { FiscalObligationEntity } from './entities/fiscal-obligation.entity';
import { FiscalService } from './fiscal.service';

@ApiTags('Fiscal')
@Controller('fiscal')
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  @Get('obligations')
  @ApiHeader({ name: 'X-Company-ID', required: true })
  @ApiOkResponse({ description: 'Lista obrigações fiscais (DAS/DASN)' })
  listObligations(
    @Headers('x-company-id') organizationId: string,
  ): Promise<FiscalObligationEntity[]> {
    return this.fiscalService.findAll(organizationId);
  }
}
