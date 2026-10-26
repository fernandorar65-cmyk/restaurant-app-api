import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { validateEnvironment } from './common/infrastructure/config/environment.validation.js';
import { buildTypeOrmOptions } from './common/persistence/database/typeorm.config.js';
import { IamModule } from './iam/iam.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { AttentionModule } from './attention/attention.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { FinanceModule } from './finance/finance.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { PaymentsModule } from './payments/payments.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    IamModule,
    OrganizationsModule,
    CatalogModule,
    AttentionModule,
    PaymentsModule,
    InventoryModule,
    FinanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
