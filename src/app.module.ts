import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { buildTypeOrmOptions } from './common/persistence/database/typeorm.config.js';
import { IamModule } from './iam/iam.module.js';
import { OrganizationsContextModule } from './organizations/organizations.module.js';
import { AttentionModule } from './attention/attention.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    IamModule,
    OrganizationsContextModule,
    AttentionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
