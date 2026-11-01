import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function buildTypeOrmOptions(
  configService: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'postgres'),
    password: configService.get<string>('DB_PASSWORD', 'postgres'),
    database: configService.get<string>('DB_DATABASE', 'restaurant_api'),
    autoLoadEntities: true,
    // The schema is owned by the versioned migrations (npm run migration:run).
    // synchronize is opt-in for throwaway local databases only and is never
    // honoured in production.
    synchronize:
      configService.get<string>('NODE_ENV', 'development') !== 'production' &&
      configService.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
  };
}
