import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { ClientsModule } from './modules/clients/clients.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    HealthModule,
    ClientsModule,
    FiscalModule,
    NotificationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
