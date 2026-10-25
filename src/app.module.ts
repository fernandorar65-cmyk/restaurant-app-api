import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { buildTypeOrmOptions } from './common/persistence/database/typeorm.config.js';
import { IamModule } from './iam/iam.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { AttentionModule } from './attention/attention.module.js';
import { CustomersModule } from './customers/customers.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    IamModule,
    OrganizationsModule,
    CustomersModule,
    AttentionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
