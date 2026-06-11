import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { buildTypeOrmOptions } from './database/typeorm.config';
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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        buildTypeOrmOptions(configService),
    }),
    HealthModule,
    ClientsModule,
    FiscalModule,
    NotificationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
