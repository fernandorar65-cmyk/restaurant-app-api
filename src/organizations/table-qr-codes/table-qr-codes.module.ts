import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiningTablesModule } from '../dining-tables/dining-tables.module.js';
import { TableQrCode } from './entities/table-qr-code.entity.js';
import { TableQrCodesController } from './table-qr-codes.controller.js';
import { TableQrCodesService } from './table-qr-codes.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([TableQrCode]), DiningTablesModule],
  controllers: [TableQrCodesController],
  providers: [TableQrCodesService],
  exports: [TableQrCodesService],
})
export class TableQrCodesModule {}
