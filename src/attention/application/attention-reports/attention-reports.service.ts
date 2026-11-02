import { Inject, Injectable } from '@nestjs/common';
import { ATTENTION_REPOSITORY } from '../../domain/repositories/attention.repository.js';
import type {
  AttentionRepository,
  DailyAttentionCounts,
  DatedAttentionCounts,
} from '../../domain/repositories/attention.repository.js';
import { ORDER_ITEM_REPOSITORY } from '../../domain/repositories/order-item.repository.js';
import type {
  ItemReportFilter,
  OrderItemRepository,
  ProductSales,
  StageDuration,
} from '../../domain/repositories/order-item.repository.js';

/** Public read API of attention for reporting contexts (finance). */
@Injectable()
export class AttentionReportsService {
  constructor(
    @Inject(ATTENTION_REPOSITORY)
    private readonly attentionRepository: AttentionRepository,
    @Inject(ORDER_ITEM_REPOSITORY)
    private readonly itemRepository: OrderItemRepository,
  ) {}

  dailyCounts(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<DailyAttentionCounts> {
    return this.attentionRepository.countDaily(restaurantId, businessDate, timeZone);
  }

  countsByDate(
    restaurantId: string,
    from: string,
    to: string,
    timeZone: string,
  ): Promise<DatedAttentionCounts[]> {
    return this.attentionRepository.countByDate(restaurantId, from, to, timeZone);
  }

  productSales(filter: ItemReportFilter, limit: number): Promise<ProductSales[]> {
    return this.itemRepository.productSales(filter, limit);
  }

  stageDurations(filter: ItemReportFilter): Promise<StageDuration[]> {
    return this.itemRepository.stageDurations(filter);
  }
}
