import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from '../../../../../common/domain/payment-method.enum.js';
import { roundMoney } from '../../../../../common/domain/value-objects/money.js';
import {
  MethodTotals,
  PaymentLedgerRepository,
} from '../../../../domain/repositories/payment-ledger.repository.js';
import { PaymentAllocationOrmEntity } from '../entities/payment-allocation.orm-entity.js';
import { PaymentOrmEntity } from '../entities/payment.orm-entity.js';
import { RefundOrmEntity } from '../entities/refund.orm-entity.js';

/**
 * Read model over payments and refunds. Which statuses count is decided by
 * the catalog flags (counts_toward_balance / counts_as_refunded), never by
 * hard-coded status lists.
 */
@Injectable()
export class TypeOrmPaymentLedgerRepository implements PaymentLedgerRepository {
  constructor(
    @InjectRepository(PaymentOrmEntity)
    private readonly payments: Repository<PaymentOrmEntity>,
    @InjectRepository(RefundOrmEntity)
    private readonly refunds: Repository<RefundOrmEntity>,
    @InjectRepository(PaymentAllocationOrmEntity)
    private readonly allocations: Repository<PaymentAllocationOrmEntity>,
  ) {}

  async paidAmount(attentionId: string): Promise<number> {
    const paid = await this.payments
      .createQueryBuilder('payment')
      .innerJoin('payment.status', 'status')
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .where('payment.attention_id = :attentionId', { attentionId })
      .andWhere('status.counts_toward_balance')
      .getRawOne<{ total: string }>();
    const refunded = await this.refunds
      .createQueryBuilder('refund')
      .innerJoin('refund.payment', 'payment')
      .innerJoin('refund.status', 'status')
      .select('COALESCE(SUM(refund.amount), 0)', 'total')
      .where('payment.attention_id = :attentionId', { attentionId })
      .andWhere('status.counts_as_refunded')
      .getRawOne<{ total: string }>();
    return roundMoney(Number(paid?.total ?? 0) - Number(refunded?.total ?? 0));
  }

  async itemsWithPayments(orderItemIds: string[]): Promise<string[]> {
    if (orderItemIds.length === 0) {
      return [];
    }
    const rows = await this.allocations
      .createQueryBuilder('allocation')
      .innerJoin('allocation.payment', 'payment')
      .innerJoin('payment.status', 'status')
      .select('DISTINCT allocation.order_item_id', 'orderItemId')
      .where('allocation.order_item_id IN (:...orderItemIds)', { orderItemIds })
      .andWhere('(status.counts_toward_balance OR NOT status.is_terminal)')
      .getRawMany<{ orderItemId: string }>();
    return rows.map((row) => row.orderItemId);
  }

  async dailyTotals(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<MethodTotals[]> {
    const gross = await this.payments
      .createQueryBuilder('payment')
      .innerJoin('payment.status', 'status')
      .select('payment.payment_method', 'method')
      .addSelect('SUM(payment.amount)', 'total')
      .where('payment.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('status.counts_toward_balance')
      .andWhere('(payment.paid_at AT TIME ZONE :timeZone)::date = :businessDate', {
        timeZone,
        businessDate,
      })
      .groupBy('payment.payment_method')
      .getRawMany<{ method: PaymentMethod; total: string }>();
    const refunded = await this.refunds
      .createQueryBuilder('refund')
      .innerJoin('refund.payment', 'payment')
      .innerJoin('refund.status', 'status')
      .select('payment.payment_method', 'method')
      .addSelect('SUM(refund.amount)', 'total')
      .where('payment.restaurant_id = :restaurantId', { restaurantId })
      .andWhere('status.counts_as_refunded')
      .andWhere('(refund.completed_at AT TIME ZONE :timeZone)::date = :businessDate', {
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
