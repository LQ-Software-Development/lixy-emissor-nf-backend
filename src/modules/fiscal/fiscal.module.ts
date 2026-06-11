import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../nfe/entities/invoice.entity';
import { FiscalObligation } from './entities/fiscal-obligation.entity';
import { FiscalCronService } from './fiscal-cron.service';
import { FiscalController } from './fiscal.controller';
import { FiscalService } from './fiscal.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, FiscalObligation])],
  controllers: [FiscalController],
  providers: [FiscalService, FiscalCronService],
  exports: [FiscalService, TypeOrmModule],
})
export class FiscalModule {}
