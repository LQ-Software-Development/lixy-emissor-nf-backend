import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { NfeController } from './nfe.controller';
import { NfeService } from './nfe.service';

@Module({
  imports: [TypeOrmModule.forFeature([Invoice])],
  controllers: [NfeController],
  providers: [NfeService],
  exports: [NfeService],
})
export class NfeModule {}
