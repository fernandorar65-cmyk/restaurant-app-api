import 'dotenv/config';
import 'reflect-metadata';
import { randomBytes } from 'node:crypto';
import { DataSource } from 'typeorm';
import type { MigrationInterface } from 'typeorm';
import { entities } from '../../src/common/persistence/database/entities.js';
import { migrations } from '../../src/common/persistence/database/migrations.js';

// Throwaway databases on the docker-compose Postgres (see .env).
export const connection = {
  type: 'postgres' as const,
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
};

export interface TestDatabase {
  name: string;
  dataSource: DataSource;
  drop(): Promise<void>;
}

/**
 * Creates an empty database and applies the given migrations (all of them
 * by default), exactly as `npm run migration:run` would.
 */
export async function createTestDatabase(
  prefix: string,
  options: { migrations?: (new () => MigrationInterface)[] } = {},
): Promise<TestDatabase> {
  const name = `${prefix}_${randomBytes(4).toString('hex')}`;
  const admin = await new DataSource({
    ...connection,
    database: 'postgres',
  }).initialize();
  await admin.query(`CREATE DATABASE "${name}"`);
  const dataSource = await new DataSource({
    ...connection,
    database: name,
    entities,
    migrations: options.migrations ?? migrations,
  }).initialize();
  await dataSource.runMigrations({ transaction: 'each' });
  const database: TestDatabase = {
    name,
    dataSource,
    async drop() {
      // The test may have swapped the connection (e.g. to add migrations).
      if (database.dataSource.isInitialized) {
        await database.dataSource.destroy();
      }
      await admin.query(`DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`);
      await admin.destroy();
    },
  };
  return database;
}
