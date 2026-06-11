import { Controller, Get, Headers } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { InvoiceEntity } from './entities/invoice.entity';
import { NfeService } from './nfe.service';

@ApiTags('NFe')
@Controller('nfe')
export class NfeController {
  constructor(private readonly nfeService: NfeService) {}

  @Get('invoices')
  @ApiHeader({ name: 'X-Company-ID', required: true })
  @ApiOkResponse({ description: 'Lista notas fiscais da organização' })
  listInvoices(
    @Headers('x-company-id') organizationId: string,
  ): Promise<InvoiceEntity[]> {
    return this.nfeService.findAll(organizationId);
  }
}
