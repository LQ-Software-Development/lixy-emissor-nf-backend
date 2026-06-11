import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
// pdfkit ships CJS-only; require keeps compatibility without esModuleInterop
// eslint-disable-next-line @typescript-eslint/no-require-imports
import PDFDocument = require('pdfkit');
import { Repository } from 'typeorm';
import { CreateNfeInvoiceDto } from './dto/create-nfe-invoice.dto';
import { QueryNfeInvoicesDto } from './dto/query-nfe-invoices.dto';
import { Invoice, NfeInvoiceStatus } from './entities/invoice.entity';

export type PaginatedNfeInvoicesResult = {
  data: Invoice[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

@Injectable()
export class NfeService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
  ) {}

  async create(dto: CreateNfeInvoiceDto): Promise<Invoice> {
    const invoice = this.invoicesRepository.create({
      number: dto.number,
      series: dto.series ?? '1',
      clientId: dto.clientId ?? null,
      amount: dto.amount,
      status: NfeInvoiceStatus.DRAFT,
    });

    return this.invoicesRepository.save(invoice);
  }

  async findAll(
    query: QueryNfeInvoicesDto,
  ): Promise<PaginatedNfeInvoicesResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.invoicesRepository.createQueryBuilder('invoice');

    if (query.status) {
      queryBuilder.andWhere('invoice.status = :status', {
        status: query.status,
      });
    }

    if (query.clientId) {
      queryBuilder.andWhere('invoice.clientId = :clientId', {
        clientId: query.clientId,
      });
    }

    const [data, total] = await queryBuilder
      .orderBy('invoice.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({ where: { id } });

    if (!invoice) {
      throw new NotFoundException(`NF-e invoice with id ${id} not found`);
    }

    return invoice;
  }

  async issue(id: string, accessKey: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status !== NfeInvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be issued');
    }

    invoice.status = NfeInvoiceStatus.ISSUED;
    invoice.accessKey = accessKey;
    invoice.issuedAt = new Date();

    return this.invoicesRepository.save(invoice);
  }

  async cancel(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status !== NfeInvoiceStatus.ISSUED) {
      throw new BadRequestException('Only issued invoices can be cancelled');
    }

    invoice.status = NfeInvoiceStatus.CANCELLED;

    return this.invoicesRepository.save(invoice);
  }

  async generatePdf(id: string): Promise<Buffer> {
    const invoice = await this.findOne(id);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc
        .fontSize(18)
        .text('DANFE Simplificado — NF-e MEI', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Número: ${invoice.number}`);
      doc.text(`Série: ${invoice.series}`);
      doc.text(`Valor: R$ ${invoice.amount}`);
      doc.text(`Status: ${invoice.status}`);

      if (invoice.accessKey) {
        doc.text(`Chave de acesso: ${invoice.accessKey}`);
      }

      if (invoice.issuedAt) {
        doc.text(`Emitida em: ${invoice.issuedAt.toISOString()}`);
      }

      doc.end();
    });
  }
}
