import 'dotenv/config';
import 'reflect-metadata';
import { randomBytes } from 'node:crypto';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import { entities } from '../../src/common/persistence/database/entities.js';

// Builds the whole model on a throwaway database (requires the docker-compose
// Postgres to be running) and checks the expected tables plus the
// constraints that carry business rules. The table list follows the model
// review (ACMR observations): table_qr_codes folded into dining_tables, work
// areas and job positions added, allergens removed, organization-wide
// categories linked to products and menu sections, order_batches renamed
// to orders, payments with status catalogs, gateway mappings and events
// (refund tables modeled, refunds not enabled yet).
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
  'work_areas',
  'job_positions',
  // catalog
  'categories',
  'product_categories',
  'products',
  'menus',
  'menu_sections',
  'menu_products',
  'product_ingredients',
  // attention
  'attentions',
  'attention_participants',
  'orders',
  'order_items',
  'order_item_status_history',
  'fulfillments',
  // payments
  'payment_statuses',
  'payments',
  'payment_allocations',
  'payment_provider_status_mappings',
  'payment_provider_events',
  'refund_statuses',
  'refunds',
  'refund_allocations',
  'refund_provider_status_mappings',
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

  it('creates the tables of the model plus the auth support tables', async () => {
    const rows: { table_name: string }[] = await dataSource.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    );
    const tables = rows.map((row) => row.table_name).sort();

    expect(tables).toEqual([...EXPECTED_TABLES, ...AUTH_SUPPORT_TABLES].sort());
  });

  it('creates the partial unique indexes', async () => {
    const rows: { indexname: string; indexdef: string }[] =
      await dataSource.query(
        `SELECT indexname, indexdef FROM pg_indexes
         WHERE indexname IN ('uq_attentions_active_table', 'uq_payments_provider_payment')`,
      );
    const byName = new Map(rows.map((row) => [row.indexname, row.indexdef]));

    expect(byName.get('uq_attentions_active_table')).toMatch(
      /UNIQUE INDEX .* WHERE .*OPEN.*BILL_REQUESTED/,
    );
    expect(byName.get('uq_payments_provider_payment')).toMatch(
      /UNIQUE INDEX .* WHERE .*provider_payment_id IS NOT NULL/,
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

  it('keeps one consistent QR per table and unique names ignoring case', async () => {
    const [organization] = await dataSource.query(
      `INSERT INTO organizations (name) VALUES ('Org QR') RETURNING id`,
    );
    await expect(
      dataSource.query(
        `INSERT INTO work_areas (organization_id, name) VALUES ($1, 'Cocina'), ($1, 'cocina')`,
        [organization.id],
      ),
    ).rejects.toThrow(/uq_work_areas_organization_name/);
    const [restaurant] = await dataSource.query(
      `INSERT INTO restaurants (organization_id, code, slug, name)
       VALUES ($1, 'QR', 'qr', 'Sede QR') RETURNING id`,
      [organization.id],
    );
    const [floor] = await dataSource.query(
      `INSERT INTO restaurant_floors (restaurant_id, name) VALUES ($1, 'P1') RETURNING id`,
      [restaurant.id],
    );
    await expect(
      dataSource.query(
        `INSERT INTO dining_tables (restaurant_id, floor_id, code, name, qr_token_hash)
         VALUES ($1, $2, 'M1', 'Mesa 1', 'hash-without-version')`,
        [restaurant.id, floor.id],
      ),
    ).rejects.toThrow(/chk_tables_qr_consistency/);
  });

  it('keeps category names unique per level, ignoring case', async () => {
    const [organization] = await dataSource.query(
      `INSERT INTO organizations (name) VALUES ('Org Cat') RETURNING id`,
    );
    const [food] = await dataSource.query(
      `INSERT INTO categories (organization_id, name) VALUES ($1, 'Comidas') RETURNING id`,
      [organization.id],
    );
    await expect(
      dataSource.query(
        `INSERT INTO categories (organization_id, name) VALUES ($1, 'comidas')`,
        [organization.id],
      ),
    ).rejects.toThrow(/uq_categories_root_name/);

    const addChild = () =>
      dataSource.query(
        `INSERT INTO categories (organization_id, parent_category_id, name)
         VALUES ($1, $2, 'Carnes')`,
        [organization.id, food.id],
      );
    await addChild();
    await expect(addChild()).rejects.toThrow(/uq_categories_parent_name/);
    // The same name is fine under another parent (here: at the root).
    await dataSource.query(
      `INSERT INTO categories (organization_id, name) VALUES ($1, 'Carnes')`,
      [organization.id],
    );
  });

  it('links order_items to orders through order_id', async () => {
    const [foreignKey] = await dataSource.query(
      `SELECT kcu.column_name, ccu.table_name AS referenced_table, ccu.column_name AS referenced_column
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
       JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
       WHERE tc.table_name = 'order_items' AND tc.constraint_type = 'FOREIGN KEY'
         AND ccu.table_name = 'orders'`,
    );
    expect(foreignKey).toEqual({
      column_name: 'order_id',
      referenced_table: 'orders',
      referenced_column: 'id',
    });
    const leftovers: unknown[] = await dataSource.query(
      `SELECT table_name, column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND (table_name LIKE '%batch%' OR column_name LIKE '%batch%')`,
    );
    expect(leftovers).toEqual([]);
  });

  it('keeps payment allocations consistent with their target', async () => {
    const [status] = await dataSource.query(
      `INSERT INTO payment_statuses (code, name, is_terminal, counts_toward_balance, allows_refund)
       VALUES ('PAID', 'Pagado', false, true, true) RETURNING id`,
    );
    const [payment] = await dataSource.query(
      `INSERT INTO payments (organization_id, restaurant_id, attention_id, payment_status_id,
         payment_method, allocation_mode, amount, currency_code, request_id)
       VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), $1,
         'CASH', 'FULL', 10, 'PEN', gen_random_uuid()) RETURNING id`,
      [status.id],
    );
    const allocate = (concept: string, orderItemId: string | null, amount = 5) =>
      dataSource.query(
        `INSERT INTO payment_allocations (payment_id, concept, order_item_id, allocated_amount)
         VALUES ($1, $2, $3, $4)`,
        [payment.id, concept, orderItemId, amount],
      );
    await expect(allocate('ORDER_ITEM', null)).rejects.toThrow(/chk_allocations_target/);
    await expect(allocate('DELIVERY_FEE', null, 0)).rejects.toThrow(/chk_allocations_amount/);
    await allocate('DELIVERY_FEE', null);
    await expect(allocate('DELIVERY_FEE', null)).rejects.toThrow(
      /uq_allocations_payment_delivery_fee/,
    );
    await expect(
      dataSource.query(
        `INSERT INTO payment_statuses (code, name, is_terminal, counts_toward_balance, allows_refund)
         VALUES ('paid', 'x', false, false, false)`,
      ),
    ).rejects.toThrow(/chk_payment_statuses_code/);
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
