import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AttentionModule } from './contexts/attention/attention.module.js';
import { buildTypeOrmOptions } from './database/typeorm.config.js';
import { IamModule } from './contexts/iam/iam.module.js';
import { OrganizationsContextModule } from './contexts/organizations/organizations.module.js';

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
