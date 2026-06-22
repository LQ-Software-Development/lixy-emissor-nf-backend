import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { CreateNfeInvoiceDto } from './dto/create-nfe-invoice.dto';
import { QueryNfeInvoicesDto } from './dto/query-nfe-invoices.dto';
import { Invoice } from './entities/invoice.entity';
import { NfeService } from './nfe.service';

@ApiTags('Invoices')
@Controller('invoices')
export class NfeController {
  constructor(private readonly nfeService: NfeService) {}

  @Post()
  @ApiOperation({ summary: 'Create and emit an NF-e invoice' })
  create(@Body() dto: CreateNfeInvoiceDto): Promise<Invoice> {
    return this.nfeService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List invoices with pagination' })
  findAll(@Query() query: QueryNfeInvoicesDto) {
    return this.nfeService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Invoice> {
    return this.nfeService.findOne(id);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Re-send invoice email to the client' })
  send(@Param('id', ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
    return this.nfeService.send(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an issued invoice' })
  cancel(@Param('id', ParseUUIDPipe) id: string): Promise<Invoice> {
    return this.nfeService.cancel(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Generate a simplified DANFE PDF for the invoice' })
  @ApiProduces('application/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="danfe.pdf"')
  async downloadPdf(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    const buffer = await this.nfeService.generatePdf(id);
    return new StreamableFile(buffer);
  }
}
