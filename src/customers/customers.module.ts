import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PASSWORD_HASHER } from '../common/application/ports/password-hasher.port.js';
import { ScryptPasswordHasher } from '../common/infrastructure/security/scrypt-password-hasher.js';
import { CustomersAuthService } from './application/auth/customers-auth.service.js';
import { CustomersService } from './application/customers/customers.service.js';
import { PASSWORD_RESET_NOTIFIER } from './application/ports/password-reset-notifier.port.js';
import { CUSTOMER_REPOSITORY } from './domain/repositories/customer.repository.js';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token.repository.js';
import { CustomerOrmEntity } from './infrastructure/persistence/typeorm/entities/customer.orm-entity.js';
import { RefreshTokenOrmEntity } from './infrastructure/persistence/typeorm/entities/refresh-token.orm-entity.js';
import { TypeOrmCustomerRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-customer.repository.js';
import { TypeOrmRefreshTokenRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-refresh-token.repository.js';
import { ConsolePasswordResetNotifierAdapter } from './infrastructure/notifications/console-password-reset-notifier.adapter.js';
import { CustomerAuthGuard } from './infrastructure/http/guards/customer-auth.guard.js';
import { CustomerAuthController } from './infrastructure/http/controllers/customer-auth.controller.js';
import { CustomerMeController } from './infrastructure/http/controllers/customer-me.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerOrmEntity, RefreshTokenOrmEntity]),
    JwtModule.register({}),
  ],
  controllers: [CustomerAuthController, CustomerMeController],
  providers: [
    CustomersService,
    CustomersAuthService,
    CustomerAuthGuard,
    { provide: CUSTOMER_REPOSITORY, useClass: TypeOrmCustomerRepository },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: TypeOrmRefreshTokenRepository,
    },
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasher },
    {
      provide: PASSWORD_RESET_NOTIFIER,
      useClass: ConsolePasswordResetNotifierAdapter,
    },
  ],
  exports: [CustomersService, CustomersAuthService],
})
export class CustomersModule {}
