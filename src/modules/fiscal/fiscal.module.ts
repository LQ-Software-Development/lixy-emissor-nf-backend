import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FiscalObligationEntity } from './entities/fiscal-obligation.entity';
import { FiscalController } from './fiscal.controller';
import { FiscalService } from './fiscal.service';

@Module({
  imports: [TypeOrmModule.forFeature([FiscalObligationEntity])],
  controllers: [FiscalController],
  providers: [FiscalService],
  exports: [FiscalService],
})
export class FiscalModule {}
