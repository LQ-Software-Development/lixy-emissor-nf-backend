import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from '../clients/clients.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { Invoice } from './entities/invoice.entity';
import { NfeController } from './nfe.controller';
import { NfeService } from './nfe.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice]),
    ClientsModule,
    NotificationsModule,
  ],
  controllers: [NfeController],
  providers: [NfeService],
  exports: [NfeService],
})
export class NfeModule {}
