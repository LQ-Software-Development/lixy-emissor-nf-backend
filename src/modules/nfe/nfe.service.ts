import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
// pdfkit ships CJS-only; require keeps compatibility without esModuleInterop
// eslint-disable-next-line @typescript-eslint/no-require-imports
import PDFDocument = require('pdfkit');
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Client } from '../clients/entities/client.entity';
import { ClientsService } from '../clients/clients.service';
import { EmailService } from '../notifications/services/email.service';
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

const MAX_NUMBER_RETRIES = 3;

@Injectable()
export class NfeService {
  private readonly logger = new Logger(NfeService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly clientsService: ClientsService,
    private readonly emailService: EmailService,
  ) {}

  async create(dto: CreateNfeInvoiceDto): Promise<Invoice> {
    const client = await this.clientsService.findOne(dto.clientId);

    for (let attempt = 0; attempt < MAX_NUMBER_RETRIES; attempt++) {
      try {
        const invoice = await this.dataSource.transaction(async (manager) => {
          const number = await this.generateNextNumber(manager);
          const entity = manager.create(Invoice, {
            number,
            series: '1',
            clientId: dto.clientId,
            description: dto.description,
            amount: dto.amount,
            status: NfeInvoiceStatus.ISSUED,
            issuedAt: new Date(),
          });

          return manager.save(entity);
        });

        await this.sendInvoiceEmail(invoice, client);
        return invoice;
      } catch (error) {
        if (
          this.isUniqueNumberViolation(error) &&
          attempt < MAX_NUMBER_RETRIES - 1
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new BadRequestException('Failed to generate a unique invoice number');
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

  async send(id: string): Promise<{ success: boolean }> {
    const invoice = await this.findOne(id);

    if (!invoice.clientId) {
      this.logger.warn(`Invoice ${id} has no client; skipping email`);
      return { success: false };
    }

    try {
      const client = await this.clientsService.findOne(invoice.clientId);
      const success = await this.sendInvoiceEmail(invoice, client);
      return { success };
    } catch (error) {
      this.logger.warn(
        `Failed to send invoice email for ${id}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return { success: false };
    }
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
    let clientName: string | null = null;

    if (invoice.clientId) {
      try {
        const client = await this.clientsService.findOne(invoice.clientId);
        clientName = client.name;
      } catch {
        clientName = null;
      }
    }

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

      if (clientName) {
        doc.text(`Cliente: ${clientName}`);
      }

      doc.text(`Descrição: ${invoice.description}`);
      doc.text(`Valor: R$ ${invoice.amount}`);
      doc.text(`Status: ${invoice.status}`);

      if (invoice.issuedAt) {
        doc.text(`Emitida em: ${invoice.issuedAt.toISOString()}`);
      }

      doc.end();
    });
  }

  private async generateNextNumber(manager: EntityManager): Promise<string> {
    const result = await manager
      .createQueryBuilder(Invoice, 'invoice')
      .select('MAX(CAST(invoice.number AS INTEGER))', 'maxNumber')
      .getRawOne<{ maxNumber: string | null }>();

    const currentMax = Number.parseInt(result?.maxNumber ?? '0', 10) || 0;
    const nextNumber = currentMax + 1;

    return nextNumber.toString().padStart(9, '0');
  }

  private async sendInvoiceEmail(
    invoice: Invoice,
    client: Client,
  ): Promise<boolean> {
    if (!this.emailService.isConfigured()) {
      this.logger.warn('RESEND_API_KEY not configured; skipping invoice email');
      return false;
    }

    if (!client.email) {
      this.logger.warn(
        `Client ${client.id} has no email; skipping invoice email`,
      );
      return false;
    }

    const issuedDate =
      invoice.issuedAt?.toISOString() ?? new Date().toISOString();
    const subject = `Nota Fiscal #${invoice.number}`;
    const html = `
      <h2>Nota Fiscal #${invoice.number}</h2>
      <p><strong>Descrição:</strong> ${invoice.description}</p>
      <p><strong>Valor:</strong> R$ ${invoice.amount}</p>
      <p><strong>Emitida em:</strong> ${issuedDate}</p>
    `;

    return this.emailService.send({
      to: client.email,
      subject,
      html,
    });
  }

  private isUniqueNumberViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { code?: string }).code === '23505'
    );
  }
}
