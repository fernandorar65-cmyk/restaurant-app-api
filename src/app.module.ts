import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AttentionModule } from './attention/attention.module.js';
import { AuthModule } from './auth/auth.module.js';
import { buildTypeOrmOptions } from './database/typeorm.config.js';
import { IamModule } from './iam/iam.module.js';
import { MenuItemsModule } from './menu-items/menu-items.module.js';
import { OrganizationsContextModule } from './organizations/organizations.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: buildTypeOrmOptions,
    }),
    AuthModule,
    MenuItemsModule,
    IamModule,
    OrganizationsContextModule,
    AttentionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
