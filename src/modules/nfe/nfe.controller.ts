import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Invoice } from '../fiscal/entities/invoice.entity';
import { NfeService } from './nfe.service';

@ApiTags('NFe')
@Controller('nfe')
export class NfeController {
  constructor(private readonly nfeService: NfeService) {}

  @Get('invoices')
  @ApiOperation({ summary: 'List issued invoices (NF-e)' })
  @ApiOkResponse({ description: 'Lista de notas fiscais emitidas' })
  listInvoices(): Promise<Invoice[]> {
    return this.nfeService.findAll();
  }
}
