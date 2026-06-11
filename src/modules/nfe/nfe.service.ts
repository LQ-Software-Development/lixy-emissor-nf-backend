import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import PDFDocument = require('pdfkit');
import { Repository } from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceResponseDto } from './dto/invoice-response.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';

export type PaginatedInvoicesResult = {
  data: InvoiceResponseDto[];
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
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
  ) {}

  async create(
    userId: string,
    dto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    if (dto.clientId) {
      const client = await this.clientsRepository.findOne({
        where: { id: dto.clientId },
      });

      if (!client) {
        throw new NotFoundException(`Client with id ${dto.clientId} not found`);
      }
    }

    const number = await this.generateInvoiceNumber();
    const invoice = this.invoicesRepository.create({
      userId,
      clientId: dto.clientId ?? null,
      number,
      amount: dto.amount.toFixed(2),
      description: dto.description ?? null,
      status: InvoiceStatus.ISSUED,
      issuedAt: new Date(),
      cancelledAt: null,
    });

    const saved = await this.invoicesRepository.save(invoice);
    return this.toResponseDto(saved);
  }

  async findAll(
    userId: string,
    query: QueryInvoicesDto,
  ): Promise<PaginatedInvoicesResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.invoicesRepository
      .createQueryBuilder('invoice')
      .where('invoice.userId = :userId', { userId });

    if (query.status) {
      queryBuilder.andWhere('invoice.status = :status', {
        status: query.status,
      });
    }

    const [invoices, total] = await queryBuilder
      .orderBy('invoice.issuedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: invoices.map((invoice) => this.toResponseDto(invoice)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(userId: string, id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.findOwnedInvoice(userId, id);
    return this.toResponseDto(invoice);
  }

  async cancel(userId: string, id: string): Promise<InvoiceResponseDto> {
    const invoice = await this.findOwnedInvoice(userId, id);

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Invoice is already cancelled');
    }

    invoice.status = InvoiceStatus.CANCELLED;
    invoice.cancelledAt = new Date();

    const saved = await this.invoicesRepository.save(invoice);
    return this.toResponseDto(saved);
  }

  async generatePdf(userId: string, id: string): Promise<Buffer> {
    const invoice = await this.findOwnedInvoice(userId, id);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc
        .fontSize(18)
        .text('Nota Fiscal de Serviço — MEI', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Número: ${invoice.number}`);
      doc.text(`Status: ${invoice.status}`);
      doc.text(`Emitida em: ${invoice.issuedAt.toISOString()}`);
      doc.text(`Valor: R$ ${Number(invoice.amount).toFixed(2)}`);

      if (invoice.description) {
        doc.text(`Descrição: ${invoice.description}`);
      }

      if (invoice.clientId) {
        doc.text(`Cliente ID: ${invoice.clientId}`);
      }

      doc.moveDown();
      doc.fontSize(10).text('Documento gerado por lixy-emissor-nf-backend', {
        align: 'center',
      });

      doc.end();
    });
  }

  private async findOwnedInvoice(userId: string, id: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository.findOne({
      where: { id, userId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return invoice;
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `NF-${year}-`;

    const latest = await this.invoicesRepository
      .createQueryBuilder('invoice')
      .where('invoice.number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('invoice.number', 'DESC')
      .getOne();

    const nextSequence = latest
      ? Number(latest.number.replace(prefix, '')) + 1
      : 1;

    return `${prefix}${String(nextSequence).padStart(6, '0')}`;
  }

  private toResponseDto(invoice: Invoice): InvoiceResponseDto {
    return {
      id: invoice.id,
      userId: invoice.userId,
      clientId: invoice.clientId,
      number: invoice.number,
      amount: Number(invoice.amount),
      description: invoice.description,
      status: invoice.status,
      issuedAt: invoice.issuedAt.toISOString(),
      cancelledAt: invoice.cancelledAt
        ? invoice.cancelledAt.toISOString()
        : null,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
    };
  }
}
