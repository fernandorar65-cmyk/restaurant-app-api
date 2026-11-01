import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ScopeResolverRegistry } from '../../../common/infrastructure/http/access/scope-resolver.registry.js';
import { PAYMENT_REPOSITORY } from '../../domain/repositories/payment.repository.js';
import type { PaymentRepository } from '../../domain/repositories/payment.repository.js';

/** Tells the authorization guard which restaurant each payment belongs to. */
@Injectable()
export class PaymentsScopeResolvers implements OnModuleInit {
  constructor(
    private readonly registry: ScopeResolverRegistry,
    @Inject(PAYMENT_REPOSITORY) private readonly payments: PaymentRepository,
  ) {}

  onModuleInit(): void {
    this.registry.register('payment', async (id) => {
      const payment = await this.payments.findById(id);
      return (
        payment && {
          organizationId: payment.organizationId,
          restaurantId: payment.restaurantId,
        }
      );
    });
  }
}
