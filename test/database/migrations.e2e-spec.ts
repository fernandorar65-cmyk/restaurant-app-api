import { DataSource } from 'typeorm';
import { entities } from '../../src/common/infrastructure/persistence/database/entities.js';
import { migrations } from '../../src/common/infrastructure/persistence/database/migrations.js';
import { InitialSchema1761955200000 } from '../../src/common/infrastructure/persistence/database/migrations/1761955200000-InitialSchema.js';
import {
  connection,
  createTestDatabase,
  type TestDatabase,
} from '../support/test-database.js';

// TypeORM always reports this jsonb default as changed (it compares '{}' with
// '{}'::jsonb); it is not a real difference.
const KNOWN_FALSE_POSITIVE =
  /"payment_provider_events" ALTER COLUMN "payload" SET DEFAULT/;

async function pendingSchemaChanges(dataSource: DataSource): Promise<string[]> {
  const sql = await dataSource.driver.createSchemaBuilder().log();
  return sql.upQueries
    .map((query) => query.query)
    .filter((query) => !KNOWN_FALSE_POSITIVE.test(query));
}

describe('Migrations', () => {
  it('build exactly the schema of the entities on an empty database', async () => {
    const database = await createTestDatabase(
      'restaurant_api_migrations_fresh',
    );
    try {
      expect(await pendingSchemaChanges(database.dataSource)).toEqual([]);
    } finally {
      await database.drop();
    }
  });

  describe('on a database with data from before the catalogs', () => {
    let database: TestDatabase;
    let ids: Record<string, string>;
    const query = <T = Record<string, unknown>>(
      sql: string,
      params?: unknown[],
    ) => database.dataSource.query(sql, params) as Promise<T[]>;
    const one = async (sql: string, params?: unknown[]) =>
      (await query(sql, params))[0];

    beforeAll(async () => {
      database = await createTestDatabase('restaurant_api_migrations_data', {
        migrations: [InitialSchema1761955200000],
      });
      ids = await seedLegacyData(database.dataSource);
      await database.dataSource.destroy();
      // Same database, now with every migration available.
      database.dataSource = await new DataSource({
        ...connection,
        database: database.name,
        entities,
        migrations,
      }).initialize();
      await database.dataSource.runMigrations({ transaction: 'each' });
    });

    afterAll(async () => {
      await database?.drop();
    });

    it('12. keeps every record and leaves no null or orphan reference', async () => {
      expect(
        await one(`SELECT
          (SELECT count(*)::int FROM attentions) AS attentions,
          (SELECT count(*)::int FROM orders) AS orders,
          (SELECT count(*)::int FROM order_items) AS items,
          (SELECT count(*)::int FROM order_item_status_history) AS history,
          (SELECT count(*)::int FROM payments) AS payments,
          (SELECT count(*)::int FROM payment_allocations) AS allocations`),
      ).toEqual({
        attentions: 3,
        orders: 2,
        items: 3,
        history: 5,
        payments: 1,
        allocations: 2,
      });
      // Each record points to a status / type of its own restaurant.
      expect(
        await one(`SELECT
          (SELECT count(*)::int FROM attentions a
             JOIN attention_statuses s ON s.id = a.attention_status_id
             JOIN service_types t ON t.id = a.service_type_id
           WHERE s.restaurant_id <> a.restaurant_id OR t.restaurant_id <> a.restaurant_id) AS attentions,
          (SELECT count(*)::int FROM order_items i
             JOIN orders o ON o.id = i.order_id
             JOIN attentions a ON a.id = o.attention_id
             JOIN order_statuses s ON s.id = i.order_status_id
           WHERE s.restaurant_id <> a.restaurant_id) AS items`),
      ).toEqual({ attentions: 0, items: 0 });
      expect(await pendingSchemaChanges(database.dataSource)).toEqual([]);
      expect(
        await one(`SELECT to_regclass('restaurant_order_modes') AS old_table`),
      ).toEqual({
        old_table: null,
      });
    });

    it('maps the old statuses to the canonical ones', async () => {
      const attentions = await query<{
        id: string;
        code: string;
        mode: string;
      }>(
        `SELECT a.id, s.code, t.fulfillment_mode AS mode FROM attentions a
         JOIN attention_statuses s ON s.id = a.attention_status_id
         JOIN service_types t ON t.id = a.service_type_id ORDER BY a.attention_number`,
      );
      expect(attentions.map(({ code, mode }) => [code, mode])).toEqual([
        ['OPEN', 'DINE_IN'],
        ['CLOSED', 'DELIVERY'],
        ['CANCELLED', 'PICKUP'],
      ]);
      const items = await query<{ id: string; code: string }>(
        `SELECT i.id, s.code FROM order_items i JOIN order_statuses s ON s.id = i.order_status_id`,
      );
      expect(
        Object.fromEntries(items.map((item) => [item.id, item.code])),
      ).toEqual({
        [ids.preparing]: 'IN_PREPARATION',
        [ids.delivered]: 'SERVED',
        [ids.rejected]: 'REJECTED',
      });
      const history = await query<{ previous: string | null; next: string }>(
        `SELECT p.code AS previous, n.code AS next FROM order_item_status_history h
         LEFT JOIN order_statuses p ON p.id = h.previous_status_id
         JOIN order_statuses n ON n.id = h.new_status_id
         WHERE h.order_item_id = $1 ORDER BY h.changed_at`,
        [ids.delivered],
      );
      expect(history).toEqual([
        { previous: null, next: 'SUBMITTED' },
        { previous: 'SUBMITTED', next: 'IN_PREPARATION' },
        { previous: 'IN_PREPARATION', next: 'SERVED' },
      ]);
      expect(
        await one(
          `SELECT o.code FROM orders r JOIN order_statuses o ON o.id = r.order_status_id WHERE r.id = $1`,
          [ids.order],
        ),
      ).toEqual({ code: 'IN_PREPARATION' });
    });

    it('turns each restaurant order modes into service types', async () => {
      const types = await query(
        `SELECT code, is_active, minimum_order_amount::float AS minimum, delivery_fee::float AS fee,
                requires_table, requires_customer_address
         FROM service_types WHERE restaurant_id = $1 ORDER BY sort_order`,
        [ids.restaurant],
      );
      expect(types).toEqual([
        {
          code: 'DINE_IN',
          is_active: true,
          minimum: 0,
          fee: 0,
          requires_table: true,
          requires_customer_address: false,
        },
        {
          code: 'PICKUP',
          is_active: false,
          minimum: 20,
          fee: 0,
          requires_table: false,
          requires_customer_address: false,
        },
        {
          code: 'DELIVERY',
          is_active: true,
          minimum: 0,
          fee: 6,
          requires_table: false,
          requires_customer_address: true,
        },
      ]);
      // A restaurant without configured modes keeps the old defaults.
      const defaults = await query<{ code: string; is_active: boolean }>(
        `SELECT code, is_active FROM service_types WHERE restaurant_id = $1 ORDER BY sort_order`,
        [ids.otherRestaurant],
      );
      expect(defaults.map((type) => [type.code, type.is_active])).toEqual([
        ['DINE_IN', true],
        ['PICKUP', false],
        ['DELIVERY', false],
      ]);
    });

    it('points the delivery fee allocation to its fulfillment and flags pending reservations', async () => {
      expect(
        await one(
          `SELECT fulfillment_id, order_item_id FROM payment_allocations WHERE concept = 'DELIVERY_FEE'`,
        ),
      ).toEqual({ fulfillment_id: ids.fulfillment, order_item_id: null });
      expect(
        await query(
          `SELECT code, reserves_balance FROM payment_statuses ORDER BY code`,
        ),
      ).toEqual([
        { code: 'PAID', reserves_balance: false },
        { code: 'PENDING', reserves_balance: true },
      ]);
    });

    it('protects history and money from cascading deletes', async () => {
      await expect(query(`DELETE FROM payments`)).rejects.toThrow(
        /foreign key/,
      );
      await expect(query(`DELETE FROM orders`)).rejects.toThrow(/foreign key/);
      await expect(
        query(`DELETE FROM order_items WHERE id = $1`, [ids.delivered]),
      ).rejects.toThrow(/foreign key/);
    });

    it('can be reverted and applied again', async () => {
      // AccessCatalog first, then ConfigurableCatalogs.
      await database.dataSource.undoLastMigration({ transaction: 'each' });
      await database.dataSource.undoLastMigration({ transaction: 'each' });
      expect(
        await query(
          `SELECT current_status FROM order_items ORDER BY current_status`,
        ),
      ).toEqual([
        { current_status: 'DELIVERED' },
        { current_status: 'PREPARING' },
        { current_status: 'REJECTED' },
      ]);
      await database.dataSource.runMigrations({ transaction: 'each' });
      expect(await pendingSchemaChanges(database.dataSource)).toEqual([]);
    });
  });
});

/** Rows as the application wrote them before migrations existed. */
async function seedLegacyData(
  dataSource: DataSource,
): Promise<Record<string, string>> {
  const insert = async (sql: string, params: unknown[] = []): Promise<string> =>
    (
      (await dataSource.query(`${sql} RETURNING id`, params)) as {
        id: string;
      }[]
    )[0].id;

  const organization = await insert(
    `INSERT INTO organizations (name) VALUES ('Org')`,
  );
  const restaurant = await insert(
    `INSERT INTO restaurants (organization_id, code, slug, name) VALUES ($1, 'R1', 'r1', 'Sede 1')`,
    [organization],
  );
  const otherRestaurant = await insert(
    `INSERT INTO restaurants (organization_id, code, slug, name) VALUES ($1, 'R2', 'r2', 'Sede 2')`,
    [organization],
  );
  await dataSource.query(
    `INSERT INTO restaurant_order_modes (restaurant_id, mode, is_enabled, minimum_amount, delivery_fee)
     VALUES ($1, 'PICKUP', false, 20, NULL), ($1, 'DELIVERY', true, NULL, 6)`,
    [restaurant],
  );
  const floor = await insert(
    `INSERT INTO restaurant_floors (restaurant_id, name) VALUES ($1, 'Salón')`,
    [restaurant],
  );
  const table = await insert(
    `INSERT INTO dining_tables (restaurant_id, floor_id, code, name) VALUES ($1, $2, 'M1', 'Mesa 1')`,
    [restaurant, floor],
  );
  const product = await insert(
    `INSERT INTO products (restaurant_id, code, name, price) VALUES ($1, 'LOMO', 'Lomo', 40)`,
    [restaurant],
  );

  const dineIn = await insert(
    `INSERT INTO attentions (restaurant_id, dining_table_id, attention_number, service_type, status)
     VALUES ($1, $2, 'A-1', 'DINE_IN', 'OPEN')`,
    [restaurant, table],
  );
  const delivery = await insert(
    `INSERT INTO attentions (restaurant_id, attention_number, service_type, status, closed_at)
     VALUES ($1, 'A-2', 'DELIVERY', 'CLOSED', now() + interval '1 hour')`,
    [restaurant],
  );
  const pickup = await insert(
    `INSERT INTO attentions (restaurant_id, attention_number, service_type, status, cancelled_at)
     VALUES ($1, 'A-3', 'PICKUP', 'CANCELLED', now() + interval '1 hour')`,
    [restaurant],
  );
  const fulfillment = await insert(
    `INSERT INTO fulfillments (attention_id, type, customer_name, customer_phone, delivery_address, delivery_fee)
     VALUES ($1, 'DELIVERY', 'Ana', '999', 'Calle 1', 6)`,
    [delivery],
  );
  await insert(
    `INSERT INTO fulfillments (attention_id, type, customer_name, customer_phone)
     VALUES ($1, 'PICKUP', 'Luis', '988')`,
    [pickup],
  );

  const order = await insert(
    `INSERT INTO orders (attention_id, request_id, source, status) VALUES ($1, gen_random_uuid(), 'WAITER', 'PREPARING')`,
    [dineIn],
  );
  const deliveryOrder = await insert(
    `INSERT INTO orders (attention_id, request_id, source, status) VALUES ($1, gen_random_uuid(), 'CUSTOMER', 'SERVED')`,
    [delivery],
  );
  const item = (
    orderId: string,
    status: string,
    reason: string | null = null,
  ) =>
    insert(
      `INSERT INTO order_items (order_id, product_id, product_name_snapshot, unit_price, quantity, subtotal, current_status, rejection_reason)
       VALUES ($1, $2, 'Lomo', 40, 1, 40, $3, $4)`,
      [orderId, product, status, reason],
    );
  const preparing = await item(order, 'PREPARING');
  const rejected = await item(order, 'REJECTED', 'Sin stock');
  const delivered = await item(deliveryOrder, 'DELIVERED');
  const history = (
    itemId: string,
    previous: string | null,
    next: string,
    minute: number,
  ) =>
    dataSource.query(
      `INSERT INTO order_item_status_history (order_item_id, previous_status, new_status, changed_at)
       VALUES ($1, $2, $3, now() + make_interval(mins => $4))`,
      [itemId, previous, next, minute],
    );
  await history(preparing, null, 'SUBMITTED', 0);
  await history(rejected, null, 'SUBMITTED', 0);
  await history(delivered, null, 'SUBMITTED', 0);
  await history(delivered, 'SUBMITTED', 'PREPARING', 1);
  await history(delivered, 'PREPARING', 'DELIVERED', 2);

  const paid = await insert(
    `INSERT INTO payment_statuses (code, name, is_terminal, counts_toward_balance, allows_refund)
     VALUES ('PAID', 'Pagado', false, true, true)`,
  );
  await insert(
    `INSERT INTO payment_statuses (code, name, is_terminal, counts_toward_balance, allows_refund)
     VALUES ('PENDING', 'Pendiente', false, false, false)`,
  );
  const payment = await insert(
    `INSERT INTO payments (organization_id, restaurant_id, attention_id, payment_status_id,
       payment_method, allocation_mode, amount, currency_code, request_id)
     VALUES ($1, $2, $3, $4, 'CASH', 'FULL', 46, 'PEN', gen_random_uuid())`,
    [organization, restaurant, delivery, paid],
  );
  await dataSource.query(
    `INSERT INTO payment_allocations (payment_id, concept, order_item_id, allocated_amount)
     VALUES ($1, 'ORDER_ITEM', $2, 40), ($1, 'DELIVERY_FEE', NULL, 6)`,
    [payment, delivered],
  );

  return {
    restaurant,
    otherRestaurant,
    order,
    preparing,
    rejected,
    delivered,
    fulfillment,
  };
}
