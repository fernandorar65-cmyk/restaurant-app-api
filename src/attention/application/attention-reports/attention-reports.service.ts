import { Inject, Injectable } from '@nestjs/common';
import { ATTENTION_REPOSITORY } from '../../domain/repositories/attention.repository.js';
import type {
  AttentionRepository,
  DailyAttentionCounts,
} from '../../domain/repositories/attention.repository.js';

/** Public read API of attention for reporting contexts (finance). */
@Injectable()
export class AttentionReportsService {
  constructor(
    @Inject(ATTENTION_REPOSITORY)
    private readonly attentionRepository: AttentionRepository,
  ) {}

  dailyCounts(
    restaurantId: string,
    businessDate: string,
    timeZone: string,
  ): Promise<DailyAttentionCounts> {
    return this.attentionRepository.countDaily(restaurantId, businessDate, timeZone);
  }
}
