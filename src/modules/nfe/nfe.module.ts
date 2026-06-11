import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from '../clients/entities/client.entity';
import { Invoice } from './entities/invoice.entity';
import { NfeController } from './nfe.controller';
import { NfeService } from './nfe.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice, Client])],
  controllers: [NfeController],
  providers: [NfeService],
  exports: [NfeService, TypeOrmModule],
})
export class NfeModule {}
