import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiscalObligation } from './entities/fiscal-obligation.entity';
import { NotaFiscal } from './entities/nota-fiscal.entity';
import { FiscalController } from './fiscal.controller';
import { FiscalDashboardService } from './fiscal-dashboard.service';
import { ListObligationsService } from './list-obligations.service';
import { PayObligationService } from './pay-obligation.service';
import { UpdateObligationStatusJob } from './update-obligation-status.job';

@Module({
  imports: [TypeOrmModule.forFeature([NotaFiscal, FiscalObligation])],
  controllers: [FiscalController],
  providers: [
    FiscalDashboardService,
    ListObligationsService,
    PayObligationService,
    UpdateObligationStatusJob,
  ],
})
export class FiscalModule {}
