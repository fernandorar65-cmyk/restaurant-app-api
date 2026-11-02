import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validateEnvironment } from './common/infrastructure/config/environment.validation.js';
import { EventsModule } from './common/infrastructure/events/events.module.js';
import { AccessModule } from './common/infrastructure/http/access/access.module.js';
import { AuthorizationGuard } from './common/infrastructure/http/access/authorization.guard.js';
import { buildTypeOrmOptions } from './common/infrastructure/persistence/database/typeorm.config.js';
import { IamModule } from './iam/iam.module.js';
import { AuthGuard } from './iam/infrastructure/http/guards/auth.guard.js';
import { PlatformAdminGuard } from './iam/infrastructure/http/guards/platform-admin.guard.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { AttentionModule } from './attention/attention.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { FinanceModule } from './finance/finance.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { MediaModule } from './media/media.module.js';
import { ObservabilityModule } from './observability/observability.module.js';
import { PaymentsModule } from './payments/payments.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    EventsModule,
    AccessModule,
    IamModule,
    OrganizationsModule,
    CatalogModule,
    AttentionModule,
    PaymentsModule,
    InventoryModule,
    FinanceModule,
    ObservabilityModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global guards run in this order: session (unless @Public()), ACMR
    // administrators for @PlatformAdmin() routes, then tenant permissions.
    { provide: APP_GUARD, useExisting: AuthGuard },
    { provide: APP_GUARD, useExisting: PlatformAdminGuard },
    { provide: APP_GUARD, useClass: AuthorizationGuard },
  ],
})
export class AppModule {}
