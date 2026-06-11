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
import {
  CreateNfeInvoiceDto,
  IssueNfeInvoiceDto,
} from './dto/create-nfe-invoice.dto';
import { QueryNfeInvoicesDto } from './dto/query-nfe-invoices.dto';
import { Invoice } from './entities/invoice.entity';
import { NfeService } from './nfe.service';

@ApiTags('NF-e')
@Controller('nfe')
export class NfeController {
  constructor(private readonly nfeService: NfeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a draft NF-e invoice' })
  create(@Body() dto: CreateNfeInvoiceDto): Promise<Invoice> {
    return this.nfeService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List NF-e invoices with pagination' })
  findAll(@Query() query: QueryNfeInvoicesDto) {
    return this.nfeService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get NF-e invoice by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Invoice> {
    return this.nfeService.findOne(id);
  }

  @Patch(':id/issue')
  @ApiOperation({ summary: 'Issue a draft NF-e invoice' })
  issue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: IssueNfeInvoiceDto,
  ): Promise<Invoice> {
    return this.nfeService.issue(id, dto.accessKey);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an issued NF-e invoice' })
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
