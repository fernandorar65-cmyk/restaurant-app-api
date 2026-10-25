import 'dotenv/config';
import 'reflect-metadata';
import { randomBytes } from 'node:crypto';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import { entities } from '../../src/common/persistence/database/entities.js';

// Builds the whole model on a throwaway database (requires the docker-compose
// Postgres to be running) and checks the 38 expected tables plus the
// constraints that carry business rules.
const EXPECTED_TABLES = [
  // iam
  'users',
  'customer_profiles',
  'roles',
  'permissions',
  'role_permissions',
  'organization_memberships',
  // organizations
  'organizations',
  'restaurants',
  'membership_restaurants',
  'employees',
  'restaurant_order_modes',
  'restaurant_floors',
  'dining_tables',
  'table_qr_codes',
  // catalog
  'product_categories',
  'products',
  'menus',
  'menu_products',
  'allergens',
  'product_allergens',
  'product_ingredients',
  // attention
  'attentions',
  'attention_participants',
  'order_batches',
  'order_items',
  'order_item_status_history',
  'fulfillments',
  // payments
  'payments',
  'payment_allocations',
  'refunds',
  // inventory
  'inventory_categories',
  'supplies',
  'inventory_movements',
  'product_recipes',
  // finance
  'expense_categories',
  'expenses',
  'daily_closures',
  'daily_closure_payment_totals',
];

// Not in the SQL model; required by login/refresh and password reset.
const AUTH_SUPPORT_TABLES = ['refresh_tokens', 'password_reset_tokens'];

const connection = {
  type: 'postgres' as const,
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
};

describe('Database model (TypeORM entities)', () => {
  const databaseName = `restaurant_api_entities_${randomBytes(4).toString('hex')}`;
  let admin: DataSource;
  let dataSource: DataSource;

  beforeAll(async () => {
    admin = await new DataSource({ ...connection, database: 'postgres' }).initialize();
    await admin.query(`CREATE DATABASE "${databaseName}"`);

    const options: DataSourceOptions = {
      ...connection,
      database: databaseName,
      entities,
      synchronize: true,
    };
    dataSource = await new DataSource(options).initialize();
  });

  afterAll(async () => {
    await dataSource?.destroy();
    await admin?.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
    await admin?.destroy();
  });

  it('creates the 38 tables of the model plus the auth support tables', async () => {
    const rows: { table_name: string }[] = await dataSource.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    );
    const tables = rows.map((row) => row.table_name).sort();

    expect(EXPECTED_TABLES).toHaveLength(38);
    expect(tables).toEqual([...EXPECTED_TABLES, ...AUTH_SUPPORT_TABLES].sort());
  });

  it('creates the partial unique indexes', async () => {
    const rows: { indexname: string; indexdef: string }[] =
      await dataSource.query(
        `SELECT indexname, indexdef FROM pg_indexes
         WHERE indexname IN ('uq_attentions_active_table', 'uq_qr_codes_active_per_table', 'uq_payments_provider_reference')`,
      );
    const byName = new Map(rows.map((row) => [row.indexname, row.indexdef]));

    expect(byName.get('uq_attentions_active_table')).toMatch(
      /UNIQUE INDEX .* WHERE .*OPEN.*BILL_REQUESTED/,
    );
    expect(byName.get('uq_qr_codes_active_per_table')).toMatch(
      /UNIQUE INDEX .* WHERE .*is_active/,
    );
    expect(byName.get('uq_payments_provider_reference')).toMatch(
      /UNIQUE INDEX .* WHERE .*provider IS NOT NULL/,
    );
  });

  it('only allows one active attention per table', async () => {
    const [organization] = await dataSource.query(
      `INSERT INTO organizations (name) VALUES ('Org') RETURNING id`,
    );
    const [restaurant] = await dataSource.query(
      `INSERT INTO restaurants (organization_id, code, slug, name)
       VALUES ($1, 'R1', 'r1', 'Sede 1') RETURNING id`,
      [organization.id],
    );
    const [floor] = await dataSource.query(
      `INSERT INTO restaurant_floors (restaurant_id, name) VALUES ($1, 'Piso 1') RETURNING id`,
      [restaurant.id],
    );
    const [table] = await dataSource.query(
      `INSERT INTO dining_tables (restaurant_id, floor_id, code, name)
       VALUES ($1, $2, 'M1', 'Mesa 1') RETURNING id`,
      [restaurant.id, floor.id],
    );
    const openAttention = (number: string) =>
      dataSource.query(
        `INSERT INTO attentions (restaurant_id, dining_table_id, attention_number, service_type)
         VALUES ($1, $2, $3, 'DINE_IN')`,
        [restaurant.id, table.id, number],
      );

    await openAttention('A-1');
    await expect(openAttention('A-2')).rejects.toThrow(
      /uq_attentions_active_table/,
    );
  });

  it('enforces the check constraints on status values', async () => {
    await expect(
      dataSource.query(
        `INSERT INTO users (email, password_hash, first_name, status)
         VALUES ('x@test.com', 'hash', 'X', 'NOPE')`,
      ),
    ).rejects.toThrow(/chk_users_status/);
  });
});
