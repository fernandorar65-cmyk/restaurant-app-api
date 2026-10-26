import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from '../../../../../common/domain/payment-method.enum.js';
import { roundMoney } from '../../../../../common/domain/value-objects/money.js';
import { PaymentStatus } from '../../../../domain/enums/payment-status.enum.js';
import { RefundStatus } from '../../../../domain/enums/refund-status.enum.js';
import {
  MethodTotals,
  PaymentLedgerRepository,
} from '../../../../domain/repositories/payment-ledger.repository.js';
import { PaymentOrmEntity } from '../entities/payment.orm-entity.js';
import { RefundOrmEntity } from '../entities/refund.orm-entity.js';

const CONFIRMED = [
  PaymentStatus.PAID,
  PaymentStatus.PARTIALLY_REFUNDED,
  PaymentStatus.REFUNDED,
];

@Injectable()
export class TypeOrmPaymentLedgerRepository implements PaymentLedgerRepository {
  constructor(
    @InjectRepository(PaymentOrmEntity)
    private readonly payments: Repository<PaymentOrmEntity>,
    @InjectRepository(RefundOrmEntity)
    private readonly refunds: Repository<RefundOrmEntity>,
  ) {}

  async paidAmount(attentionId: string): Promise<number> {
    const paid = await this.payments
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .where('payment.attention_id = :attentionId', { attentionId })
      .andWhere('payment.status IN (:...confirmed)', { confirmed: CONFIRMED })
      .getRawOne<{ total: string }>();
    const refunded = await this.refunds
      .createQueryBuilder('refund')
      .innerJoin('refund.payment', 'payment')
      .select('COALESCE(SUM(refund.amount), 0)', 'total')
      .where('payment.attention_id = :attentionId', { attentionId })
      .andWhere('refund.status = :refunded', { refunded: RefundStatus.REFUNDED })
      .getRawOne<{ total: string }>();
    return roundMoney(Number(paid?.total ?? 0) - Number(refunded?.total ?? 0));
  }

  async dailyTotals(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<MethodTotals[]> {
    const gross = await this.payments
      .createQueryBuilder('payment')
      .select('payment.payment_method', 'method')
      .addSelect('SUM(payment.amount)', 'total')
      .where('payment.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('payment.status IN (:...confirmed)', { confirmed: CONFIRMED })
      .andWhere('(payment.paid_at AT TIME ZONE :timeZone)::date = :businessDate', {
        timeZone,
        businessDate,
      })
      .groupBy('payment.payment_method')
      .getRawMany<{ method: PaymentMethod; total: string }>();
    const refunded = await this.refunds
      .createQueryBuilder('refund')
      .innerJoin('refund.payment', 'payment')
      .select('payment.payment_method', 'method')
      .addSelect('SUM(refund.amount)', 'total')
      .where('payment.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('refund.status = :refundedStatus', {
        refundedStatus: RefundStatus.REFUNDED,
      })
      .andWhere('(refund.refunded_at AT TIME ZONE :timeZone)::date = :businessDate', {
        timeZone,
        businessDate,
      })
      .groupBy('payment.payment_method')
      .getRawMany<{ method: PaymentMethod; total: string }>();

    return Object.values(PaymentMethod)
      .map((method) => ({
        method,
        gross: roundMoney(Number(gross.find((row) => row.method === method)?.total ?? 0)),
        refunded: roundMoney(
          Number(refunded.find((row) => row.method === method)?.total ?? 0),
        ),
      }))
      .filter((totals) => totals.gross > 0 || totals.refunded > 0);
  }
}
