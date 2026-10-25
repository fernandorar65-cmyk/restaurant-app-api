import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentAllocationOrmEntity } from './infrastructure/persistence/typeorm/entities/payment-allocation.orm-entity.js';
import { PaymentOrmEntity } from './infrastructure/persistence/typeorm/entities/payment.orm-entity.js';
import { RefundOrmEntity } from './infrastructure/persistence/typeorm/entities/refund.orm-entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentOrmEntity,
      PaymentAllocationOrmEntity,
      RefundOrmEntity,
    ]),
  ],
})
export class PaymentsModule {}
