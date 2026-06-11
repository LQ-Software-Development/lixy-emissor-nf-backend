import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { HealthModule } from './health/health.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { FiscalObligation } from './modules/fiscal/entities/fiscal-obligation.entity';
import { NotaFiscal } from './modules/fiscal/entities/nota-fiscal.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [NotaFiscal, FiscalObligation],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    HealthModule,
    FiscalModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
