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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import {
  InvoiceResponseDto,
  PaginatedInvoicesResponseDto,
} from './dto/invoice-response.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { NfeService } from './nfe.service';

@ApiTags('NFe')
@ApiBearerAuth()
@Controller('nfe')
export class NfeController {
  constructor(private readonly nfeService: NfeService) {}

  @Post()
  @ApiOperation({ summary: 'Emit a new service invoice (NFS-e MEI)' })
  @ApiResponse({ status: 201, type: InvoiceResponseDto })
  create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.nfeService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List invoices with pagination' })
  @ApiResponse({ status: 200, type: PaginatedInvoicesResponseDto })
  findAll(
    @CurrentUser('sub') userId: string,
    @Query() query: QueryInvoicesDto,
  ): Promise<PaginatedInvoicesResponseDto> {
    return this.nfeService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  findOne(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InvoiceResponseDto> {
    return this.nfeService.findOne(userId, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an issued invoice' })
  @ApiResponse({ status: 200, type: InvoiceResponseDto })
  cancel(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InvoiceResponseDto> {
    return this.nfeService.cancel(userId, id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download invoice PDF' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file' })
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(
    @CurrentUser('sub') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    const buffer = await this.nfeService.generatePdf(userId, id);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="invoice-${id}.pdf"`,
    });
  }
}
