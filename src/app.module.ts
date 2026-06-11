import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { ClientsModule } from './modules/clients/clients.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { NfeModule } from './modules/nfe/nfe.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    HealthModule,
    NfeModule,
    FiscalModule,
    ClientsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
