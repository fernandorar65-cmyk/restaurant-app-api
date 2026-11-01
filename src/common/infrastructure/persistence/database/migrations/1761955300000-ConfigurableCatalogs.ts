import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Model correction (Restaurant CMR / ACMR):
 * - attention_statuses / order_statuses: configurable status catalogs per
 *   restaurant replace the varchar + CHECK statuses of attentions, orders,
 *   order_items and order_item_status_history.
 * - service_types (attention) replaces restaurant_order_modes (organizations).
 * - payment_statuses.reserves_balance makes the "pending reserves" rule
 *   explicit; payment_allocations.fulfillment_id points the delivery fee to
 *   its fulfillment.
 * - Foreign keys: payments -> organizations / restaurants / users and
 *   refunds -> users become physical; no ON DELETE CASCADE on history or
 *   money (attention tables, allocations, closures).
 *
 * Runs on databases with data: catalogs are seeded for every restaurant,
 * rows are migrated by code and verified before the old columns go away.
 * PREPARING becomes IN_PREPARATION and DELIVERED becomes SERVED.
 */
export class ConfigurableCatalogs1761955300000 implements MigrationInterface {
  name = 'ConfigurableCatalogs1761955300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Preconditions: refuse to run instead of losing or inventing data.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM restaurant_order_modes WHERE configuration_json <> '{}'::jsonb) THEN
          RAISE EXCEPTION 'restaurant_order_modes.configuration_json has data that service_types cannot hold';
        END IF;
        IF EXISTS (
          SELECT 1 FROM attentions
          WHERE (status = 'CLOSED' AND closed_at IS NULL)
             OR (status = 'CANCELLED' AND cancelled_at IS NULL)
             OR (status IN ('OPEN', 'BILL_REQUESTED') AND (closed_at IS NOT NULL OR cancelled_at IS NOT NULL))
        ) THEN
          RAISE EXCEPTION 'attentions whose status does not match closed_at / cancelled_at';
        END IF;
        IF EXISTS (
          SELECT 1 FROM payments p
          WHERE NOT EXISTS (SELECT 1 FROM organizations o WHERE o.id = p.organization_id)
             OR NOT EXISTS (SELECT 1 FROM restaurants r WHERE r.id = p.restaurant_id)
             OR (p.payer_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.payer_user_id))
             OR (p.registered_by_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.registered_by_user_id))
        ) THEN
          RAISE EXCEPTION 'payments with orphan organization / restaurant / user references';
        END IF;
        IF EXISTS (
          SELECT 1 FROM refunds f
          WHERE f.processed_by_user_id IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = f.processed_by_user_id)
        ) THEN
          RAISE EXCEPTION 'refunds with an orphan processed_by_user_id';
        END IF;
      END $$`);

    // 2. History and money no longer cascade on delete.
    await queryRunner.query(
      `ALTER TABLE "attention_participants" DROP CONSTRAINT "FK_9554285bdd0baf365ff06860fbc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fulfillments" DROP CONSTRAINT "FK_4d8546da595cf28d3cfaa2dde30"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_5222bf5540ed889dea0b3a9ba3a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" DROP CONSTRAINT "FK_82a6ebf32576cb43cc53c2fc704"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_closure_payment_totals" DROP CONSTRAINT "FK_adc6098f98522d638f02e8d8400"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refund_allocations" DROP CONSTRAINT "FK_43be4150dd27ee8609198826183"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_allocations" DROP CONSTRAINT "FK_4348f49c6822420b9503ba880b8"`,
    );

    // 3. New catalogs.
    await queryRunner.query(
      `CREATE TABLE "service_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "restaurant_id" uuid NOT NULL, "code" character varying(30) NOT NULL, "name" character varying(100) NOT NULL, "fulfillment_mode" character varying(20) NOT NULL, "requires_table" boolean NOT NULL DEFAULT false, "requires_customer_address" boolean NOT NULL DEFAULT false, "minimum_order_amount" numeric(12,2) NOT NULL DEFAULT '0', "delivery_fee" numeric(12,2) NOT NULL DEFAULT '0', "sort_order" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_service_types_restaurant_code" UNIQUE ("restaurant_id", "code"), CONSTRAINT "chk_service_types_requirements" CHECK ((NOT requires_table OR fulfillment_mode = 'DINE_IN') AND (NOT requires_customer_address OR fulfillment_mode = 'DELIVERY')), CONSTRAINT "chk_service_types_sort_order" CHECK (sort_order >= 0), CONSTRAINT "chk_service_types_fee" CHECK (delivery_fee >= 0), CONSTRAINT "chk_service_types_minimum" CHECK (minimum_order_amount >= 0), CONSTRAINT "chk_service_types_code" CHECK (code ~ '^[A-Z][A-Z0-9_]*$'), CONSTRAINT "chk_service_types_fulfillment_mode" CHECK (fulfillment_mode IN ('DINE_IN', 'PICKUP', 'DELIVERY')), CONSTRAINT "PK_1dc93417a097cdee3491f39d7cc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "attention_statuses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "restaurant_id" uuid NOT NULL, "code" character varying(30) NOT NULL, "name" character varying(100) NOT NULL, "canonical_state" character varying(30) NOT NULL, "color" character varying(7), "sort_order" integer NOT NULL, "is_initial" boolean NOT NULL DEFAULT false, "is_final" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_attention_statuses_restaurant_code" UNIQUE ("restaurant_id", "code"), CONSTRAINT "chk_attention_statuses_final" CHECK (is_final = (canonical_state IN ('CLOSED', 'CANCELLED'))), CONSTRAINT "chk_attention_statuses_initial" CHECK (NOT is_initial OR canonical_state = 'OPEN'), CONSTRAINT "chk_attention_statuses_sort_order" CHECK (sort_order >= 0), CONSTRAINT "chk_attention_statuses_color" CHECK (color IS NULL OR color ~ '^#[0-9A-F]{6}$'), CONSTRAINT "chk_attention_statuses_code" CHECK (code ~ '^[A-Z][A-Z0-9_]*$'), CONSTRAINT "chk_attention_statuses_canonical" CHECK (canonical_state IN ('OPEN', 'BILL_REQUESTED', 'CLOSED', 'CANCELLED')), CONSTRAINT "PK_16447629182845dce42ed8a7dd1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_attention_statuses_initial" ON "attention_statuses" ("restaurant_id") WHERE is_initial AND is_active`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_statuses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "restaurant_id" uuid NOT NULL, "code" character varying(30) NOT NULL, "name" character varying(100) NOT NULL, "canonical_state" character varying(30) NOT NULL, "color" character varying(7), "sort_order" integer NOT NULL, "is_initial" boolean NOT NULL DEFAULT false, "is_final" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_order_statuses_restaurant_code" UNIQUE ("restaurant_id", "code"), CONSTRAINT "chk_order_statuses_final" CHECK (is_final = (canonical_state IN ('SERVED', 'REJECTED', 'CANCELLED'))), CONSTRAINT "chk_order_statuses_initial" CHECK (NOT is_initial OR canonical_state = 'SUBMITTED'), CONSTRAINT "chk_order_statuses_sort_order" CHECK (sort_order >= 0), CONSTRAINT "chk_order_statuses_color" CHECK (color IS NULL OR color ~ '^#[0-9A-F]{6}$'), CONSTRAINT "chk_order_statuses_code" CHECK (code ~ '^[A-Z][A-Z0-9_]*$'), CONSTRAINT "chk_order_statuses_canonical" CHECK (canonical_state IN ('SUBMITTED', 'CONFIRMED', 'IN_PREPARATION', 'READY', 'SERVED', 'REJECTED', 'CANCELLED')), CONSTRAINT "PK_76c6dc5bccb3ef1a4a8510cab3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_order_statuses_initial" ON "order_statuses" ("restaurant_id") WHERE is_initial AND is_active`,
    );
    await queryRunner.query(
      `ALTER TABLE "service_types" ADD CONSTRAINT "FK_3103856dd73b244c2cefb1d3cc3" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attention_statuses" ADD CONSTRAINT "FK_e8d04ccf8cf8c267d070bf8a6df" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_statuses" ADD CONSTRAINT "FK_26c5b63c5cb0b6d94a10001afee" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // 4. Default catalogs for every existing restaurant (same seeds as
    //    src/attention/domain/workflows.ts and ServiceTypesService).
    await queryRunner.query(`
      INSERT INTO attention_statuses (restaurant_id, code, name, canonical_state, color, sort_order, is_initial, is_final)
      SELECT r.id, v.code, v.name, v.code, v.color, v.sort_order, v.code = 'OPEN', v.code IN ('CLOSED', 'CANCELLED')
      FROM restaurants r
      CROSS JOIN (VALUES
        ('OPEN', 'Abierta', '#2563EB', 10),
        ('BILL_REQUESTED', 'Cuenta solicitada', '#D97706', 20),
        ('CLOSED', 'Cerrada', '#16A34A', 30),
        ('CANCELLED', 'Cancelada', '#DC2626', 40)
      ) AS v(code, name, color, sort_order)
      ON CONFLICT (restaurant_id, code) DO NOTHING`);
    await queryRunner.query(`
      INSERT INTO order_statuses (restaurant_id, code, name, canonical_state, color, sort_order, is_initial, is_final)
      SELECT r.id, v.code, v.name, v.code, v.color, v.sort_order, v.code = 'SUBMITTED', v.code IN ('SERVED', 'REJECTED', 'CANCELLED')
      FROM restaurants r
      CROSS JOIN (VALUES
        ('SUBMITTED', 'Enviado', '#64748B', 10),
        ('CONFIRMED', 'Confirmado', '#2563EB', 20),
        ('IN_PREPARATION', 'En preparación', '#D97706', 30),
        ('READY', 'Listo', '#7C3AED', 40),
        ('SERVED', 'Servido', '#16A34A', 50),
        ('REJECTED', 'Rechazado', '#B91C1C', 60),
        ('CANCELLED', 'Cancelado', '#DC2626', 70)
      ) AS v(code, name, color, sort_order)
      ON CONFLICT (restaurant_id, code) DO NOTHING`);
    // Service types keep each restaurant's order mode settings. Without a
    // configured row only dine-in was enabled; the fee only applied to delivery.
    await queryRunner.query(`
      INSERT INTO service_types (restaurant_id, code, name, fulfillment_mode, requires_table, requires_customer_address, minimum_order_amount, delivery_fee, sort_order, is_active)
      SELECT r.id, v.mode, v.name, v.mode, v.mode = 'DINE_IN', v.mode = 'DELIVERY',
             COALESCE(m.minimum_amount, 0),
             CASE WHEN v.mode = 'DELIVERY' THEN COALESCE(m.delivery_fee, 0) ELSE 0 END,
             v.sort_order,
             COALESCE(m.is_enabled, v.mode = 'DINE_IN')
      FROM restaurants r
      CROSS JOIN (VALUES ('DINE_IN', 'En mesa', 10), ('PICKUP', 'Para recoger', 20), ('DELIVERY', 'Delivery', 30)) AS v(mode, name, sort_order)
      LEFT JOIN restaurant_order_modes m ON m.restaurant_id = r.id AND m.mode = v.mode
      ON CONFLICT (restaurant_id, code) DO NOTHING`);

    // 5. New references, nullable until migrated.
    await queryRunner.query(
      `ALTER TABLE "attentions" ADD "service_type_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" ADD "attention_status_id" uuid`,
    );
    await queryRunner.query(`ALTER TABLE "orders" ADD "order_status_id" uuid`);
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "order_status_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" ADD "previous_status_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" ADD "new_status_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_statuses" ADD "reserves_balance" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_allocations" ADD "fulfillment_id" uuid`,
    );

    // 6. Migrate the data. Old operational codes map to the canonical ones.
    const canonical = (column: string) =>
      `CASE ${column} WHEN 'PREPARING' THEN 'IN_PREPARATION' WHEN 'DELIVERED' THEN 'SERVED' ELSE ${column} END`;
    await queryRunner.query(`
      UPDATE attentions a SET attention_status_id = s.id
      FROM attention_statuses s
      WHERE s.restaurant_id = a.restaurant_id AND s.code = a.status`);
    await queryRunner.query(`
      UPDATE attentions a SET service_type_id = t.id
      FROM service_types t
      WHERE t.restaurant_id = a.restaurant_id AND t.code = a.service_type`);
    await queryRunner.query(`
      UPDATE orders o SET order_status_id = s.id
      FROM attentions a, order_statuses s
      WHERE a.id = o.attention_id AND s.restaurant_id = a.restaurant_id
        AND s.code = ${canonical('o.status')}`);
    await queryRunner.query(`
      UPDATE order_items i SET order_status_id = s.id
      FROM orders o, attentions a, order_statuses s
      WHERE o.id = i.order_id AND a.id = o.attention_id AND s.restaurant_id = a.restaurant_id
        AND s.code = ${canonical('i.current_status')}`);
    for (const [target, source] of [
      ['new_status_id', 'new_status'],
      ['previous_status_id', 'previous_status'],
    ]) {
      await queryRunner.query(`
        UPDATE order_item_status_history h SET ${target} = s.id
        FROM order_items i, orders o, attentions a, order_statuses s
        WHERE i.id = h.order_item_id AND o.id = i.order_id AND a.id = o.attention_id
          AND s.restaurant_id = a.restaurant_id AND s.code = ${canonical(`h.${source}`)}`);
    }
    await queryRunner.query(`
      UPDATE payment_statuses SET reserves_balance = code IN ('PENDING', 'PROCESSING')`);
    await queryRunner.query(`
      UPDATE payment_allocations pa SET fulfillment_id = f.id
      FROM payments p, fulfillments f
      WHERE p.id = pa.payment_id AND f.attention_id = p.attention_id AND pa.concept = 'DELIVERY_FEE'`);

    // 7. Every row must have been migrated before anything is dropped.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM attentions WHERE attention_status_id IS NULL OR service_type_id IS NULL) THEN
          RAISE EXCEPTION 'attentions without a status or service type after migrating';
        END IF;
        IF EXISTS (SELECT 1 FROM orders WHERE order_status_id IS NULL) THEN
          RAISE EXCEPTION 'orders without a status after migrating';
        END IF;
        IF EXISTS (SELECT 1 FROM order_items WHERE order_status_id IS NULL) THEN
          RAISE EXCEPTION 'order items without a status after migrating';
        END IF;
        IF EXISTS (
          SELECT 1 FROM order_item_status_history
          WHERE new_status_id IS NULL OR (previous_status IS NOT NULL AND previous_status_id IS NULL)
        ) THEN
          RAISE EXCEPTION 'order item history without its statuses after migrating';
        END IF;
        IF EXISTS (SELECT 1 FROM payment_allocations WHERE concept = 'DELIVERY_FEE' AND fulfillment_id IS NULL) THEN
          RAISE EXCEPTION 'delivery fee allocations whose attention has no fulfillment';
        END IF;
      END $$`);

    // 8. Old columns, checks and indexes; final constraints.
    await queryRunner.query(`DROP INDEX "public"."uq_attentions_active_table"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_attentions_restaurant_status"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_order_items_status"`);
    await queryRunner.query(
      `ALTER TABLE "attentions" DROP CONSTRAINT "chk_attentions_table_by_service"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" DROP CONSTRAINT "chk_attentions_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" DROP CONSTRAINT "chk_attentions_service_type"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "chk_orders_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" DROP CONSTRAINT "chk_item_history_new"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" DROP CONSTRAINT "chk_item_history_previous"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "chk_order_items_rejection"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "chk_order_items_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_allocations" DROP CONSTRAINT "chk_allocations_target"`,
    );
    await queryRunner.query(`ALTER TABLE "attentions" DROP COLUMN "status"`);
    await queryRunner.query(
      `ALTER TABLE "attentions" DROP COLUMN "service_type"`,
    );
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "status"`);
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "current_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" DROP COLUMN "new_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" DROP COLUMN "previous_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" ALTER COLUMN "service_type_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" ALTER COLUMN "attention_status_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "order_status_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ALTER COLUMN "order_status_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" ALTER COLUMN "new_status_id" SET NOT NULL`,
    );

    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_attentions_active_table" ON "attentions" ("dining_table_id") WHERE dining_table_id IS NOT NULL AND closed_at IS NULL AND cancelled_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_attentions_service_type" ON "attentions" ("service_type_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_attentions_restaurant_status" ON "attentions" ("restaurant_id", "attention_status_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_orders_status" ON "orders" ("order_status_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_order_items_status" ON "order_items" ("order_status_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_allocations_fulfillment" ON "payment_allocations" ("fulfillment_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" ADD CONSTRAINT "chk_attentions_single_end" CHECK (closed_at IS NULL OR cancelled_at IS NULL)`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_statuses" ADD CONSTRAINT "chk_payment_statuses_effect" CHECK (NOT (counts_toward_balance AND reserves_balance))`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_allocations" ADD CONSTRAINT "chk_allocations_target" CHECK ((concept = 'ORDER_ITEM' AND order_item_id IS NOT NULL AND fulfillment_id IS NULL) OR (concept = 'DELIVERY_FEE' AND fulfillment_id IS NOT NULL AND order_item_id IS NULL))`,
    );

    await queryRunner.query(
      `ALTER TABLE "attention_participants" ADD CONSTRAINT "FK_9554285bdd0baf365ff06860fbc" FOREIGN KEY ("attention_id") REFERENCES "attentions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" ADD CONSTRAINT "FK_3cd4fde6df99707be4dd3fd314b" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" ADD CONSTRAINT "FK_41450efeee9718da1e4cc28b7db" FOREIGN KEY ("attention_status_id") REFERENCES "attention_statuses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fulfillments" ADD CONSTRAINT "FK_4d8546da595cf28d3cfaa2dde30" FOREIGN KEY ("attention_id") REFERENCES "attentions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_5222bf5540ed889dea0b3a9ba3a" FOREIGN KEY ("attention_id") REFERENCES "attentions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_f51b75ebdfdef60d264f982a60f" FOREIGN KEY ("order_status_id") REFERENCES "order_statuses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" ADD CONSTRAINT "FK_82a6ebf32576cb43cc53c2fc704" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" ADD CONSTRAINT "FK_6480634515db4e4f7376f50e5bb" FOREIGN KEY ("previous_status_id") REFERENCES "order_statuses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" ADD CONSTRAINT "FK_692e6e0cf6e01a18a26d0f4972a" FOREIGN KEY ("new_status_id") REFERENCES "order_statuses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_a33c5f14766c00291c72cdff035" FOREIGN KEY ("order_status_id") REFERENCES "order_statuses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_closure_payment_totals" ADD CONSTRAINT "FK_adc6098f98522d638f02e8d8400" FOREIGN KEY ("daily_closure_id") REFERENCES "daily_closures"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refund_allocations" ADD CONSTRAINT "FK_43be4150dd27ee8609198826183" FOREIGN KEY ("refund_id") REFERENCES "refunds"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_allocations" ADD CONSTRAINT "FK_4348f49c6822420b9503ba880b8" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_fc07ace491143726974991711f2" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_d19273a0dd01a303a5d8fcba583" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_bacfb039aaabc4f22f10ce42731" FOREIGN KEY ("payer_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_04ca6e45f541ceb635587673f7f" FOREIGN KEY ("registered_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "FK_59913d84f7338baf88d174fa026" FOREIGN KEY ("processed_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    // 9. Service types replace the order modes (data already copied).
    await queryRunner.query(`DROP TABLE "restaurant_order_modes"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restores the previous schema. Custom statuses and service types fall
    // back to their canonical state / mode; restaurants keep one order mode
    // per fulfillment mode (the first type by sort_order).
    await queryRunner.query(
      `CREATE TABLE "restaurant_order_modes" ("restaurant_id" uuid NOT NULL, "mode" character varying(20) NOT NULL, "is_enabled" boolean NOT NULL DEFAULT true, "minimum_amount" numeric(12,2), "delivery_fee" numeric(12,2), "configuration_json" jsonb NOT NULL DEFAULT '{}'::jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "chk_order_modes_fee" CHECK (delivery_fee IS NULL OR delivery_fee >= 0), CONSTRAINT "chk_order_modes_minimum" CHECK (minimum_amount IS NULL OR minimum_amount >= 0), CONSTRAINT "chk_order_modes_mode" CHECK (mode IN ('DINE_IN', 'PICKUP', 'DELIVERY')), CONSTRAINT "PK_8df14fd6201fe1fd4c86cb94697" PRIMARY KEY ("restaurant_id", "mode"))`,
    );
    await queryRunner.query(`
      INSERT INTO restaurant_order_modes (restaurant_id, mode, is_enabled, minimum_amount, delivery_fee)
      SELECT DISTINCT ON (restaurant_id, fulfillment_mode)
        restaurant_id, fulfillment_mode, is_active, NULLIF(minimum_order_amount, 0),
        CASE WHEN fulfillment_mode = 'DELIVERY' THEN delivery_fee END
      FROM service_types
      ORDER BY restaurant_id, fulfillment_mode, is_active DESC, sort_order`);
    await queryRunner.query(
      `ALTER TABLE "restaurant_order_modes" ADD CONSTRAINT "FK_c4a96d2303d78243ded2bfb03e9" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `ALTER TABLE "refunds" DROP CONSTRAINT "FK_59913d84f7338baf88d174fa026"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_04ca6e45f541ceb635587673f7f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_bacfb039aaabc4f22f10ce42731"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_d19273a0dd01a303a5d8fcba583"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_fc07ace491143726974991711f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_allocations" DROP CONSTRAINT "FK_4348f49c6822420b9503ba880b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refund_allocations" DROP CONSTRAINT "FK_43be4150dd27ee8609198826183"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_closure_payment_totals" DROP CONSTRAINT "FK_adc6098f98522d638f02e8d8400"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_a33c5f14766c00291c72cdff035"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" DROP CONSTRAINT "FK_692e6e0cf6e01a18a26d0f4972a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" DROP CONSTRAINT "FK_6480634515db4e4f7376f50e5bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" DROP CONSTRAINT "FK_82a6ebf32576cb43cc53c2fc704"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_f51b75ebdfdef60d264f982a60f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_5222bf5540ed889dea0b3a9ba3a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fulfillments" DROP CONSTRAINT "FK_4d8546da595cf28d3cfaa2dde30"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" DROP CONSTRAINT "FK_41450efeee9718da1e4cc28b7db"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" DROP CONSTRAINT "FK_3cd4fde6df99707be4dd3fd314b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attention_participants" DROP CONSTRAINT "FK_9554285bdd0baf365ff06860fbc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_allocations" DROP CONSTRAINT "chk_allocations_target"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_statuses" DROP CONSTRAINT "chk_payment_statuses_effect"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" DROP CONSTRAINT "chk_attentions_single_end"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_allocations_fulfillment"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_order_items_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_orders_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_attentions_restaurant_status"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_attentions_service_type"`,
    );
    await queryRunner.query(`DROP INDEX "public"."uq_attentions_active_table"`);

    const legacyItem = (column: string) =>
      `CASE ${column} WHEN 'IN_PREPARATION' THEN 'PREPARING' WHEN 'SERVED' THEN 'DELIVERED' WHEN 'CONFIRMED' THEN 'SUBMITTED' ELSE ${column} END`;
    const legacyOrder = (column: string) =>
      `CASE ${column} WHEN 'IN_PREPARATION' THEN 'PREPARING' WHEN 'REJECTED' THEN 'CANCELLED' ELSE ${column} END`;
    await queryRunner.query(
      `ALTER TABLE "attentions" ADD "status" character varying(30)`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" ADD "service_type" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD "status" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD "current_status" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" ADD "previous_status" character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" ADD "new_status" character varying(20)`,
    );
    await queryRunner.query(`
      UPDATE attentions a SET status = s.canonical_state, service_type = t.fulfillment_mode
      FROM attention_statuses s, service_types t
      WHERE s.id = a.attention_status_id AND t.id = a.service_type_id`);
    await queryRunner.query(`
      UPDATE orders o SET status = ${legacyOrder('s.canonical_state')}
      FROM order_statuses s WHERE s.id = o.order_status_id`);
    await queryRunner.query(`
      UPDATE order_items i SET current_status = ${legacyItem('s.canonical_state')}
      FROM order_statuses s WHERE s.id = i.order_status_id`);
    await queryRunner.query(`
      UPDATE order_item_status_history h SET new_status = ${legacyItem('s.canonical_state')}
      FROM order_statuses s WHERE s.id = h.new_status_id`);
    await queryRunner.query(`
      UPDATE order_item_status_history h SET previous_status = ${legacyItem('s.canonical_state')}
      FROM order_statuses s WHERE s.id = h.previous_status_id`);
    await queryRunner.query(
      `ALTER TABLE "attentions" ALTER COLUMN "status" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" ALTER COLUMN "status" SET DEFAULT 'OPEN'`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" ALTER COLUMN "service_type" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ALTER COLUMN "current_status" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ALTER COLUMN "current_status" SET DEFAULT 'SUBMITTED'`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" ALTER COLUMN "new_status" SET NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "order_items" DROP COLUMN "order_status_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP COLUMN "order_status_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_allocations" DROP COLUMN "fulfillment_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_statuses" DROP COLUMN "reserves_balance"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" DROP COLUMN "new_status_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" DROP COLUMN "previous_status_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" DROP COLUMN "attention_status_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" DROP COLUMN "service_type_id"`,
    );
    await queryRunner.query(`DROP INDEX "public"."uq_order_statuses_initial"`);
    await queryRunner.query(`DROP TABLE "order_statuses"`);
    await queryRunner.query(
      `DROP INDEX "public"."uq_attention_statuses_initial"`,
    );
    await queryRunner.query(`DROP TABLE "attention_statuses"`);
    await queryRunner.query(`DROP TABLE "service_types"`);

    await queryRunner.query(
      `ALTER TABLE "payment_allocations" ADD CONSTRAINT "chk_allocations_target" CHECK ((concept = 'ORDER_ITEM') = (order_item_id IS NOT NULL))`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "chk_order_items_status" CHECK (current_status IN ('SUBMITTED', 'PREPARING', 'READY', 'DELIVERED', 'REJECTED', 'CANCELLED'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "chk_order_items_rejection" CHECK (current_status <> 'REJECTED' OR rejection_reason IS NOT NULL)`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" ADD CONSTRAINT "chk_item_history_previous" CHECK (previous_status IS NULL OR previous_status IN ('SUBMITTED', 'PREPARING', 'READY', 'DELIVERED', 'REJECTED', 'CANCELLED'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" ADD CONSTRAINT "chk_item_history_new" CHECK (new_status IN ('SUBMITTED', 'PREPARING', 'READY', 'DELIVERED', 'REJECTED', 'CANCELLED'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_status" CHECK (status IN ('SUBMITTED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" ADD CONSTRAINT "chk_attentions_service_type" CHECK (service_type IN ('DINE_IN', 'PICKUP', 'DELIVERY'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" ADD CONSTRAINT "chk_attentions_status" CHECK (status IN ('OPEN', 'BILL_REQUESTED', 'CLOSED', 'CANCELLED'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" ADD CONSTRAINT "chk_attentions_table_by_service" CHECK ((service_type = 'DINE_IN' AND dining_table_id IS NOT NULL) OR (service_type IN ('PICKUP', 'DELIVERY') AND dining_table_id IS NULL))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_order_items_status" ON "order_items" ("current_status", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_attentions_restaurant_status" ON "attentions" ("restaurant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_attentions_active_table" ON "attentions" ("dining_table_id") WHERE dining_table_id IS NOT NULL AND status IN ('OPEN', 'BILL_REQUESTED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_allocations" ADD CONSTRAINT "FK_4348f49c6822420b9503ba880b8" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refund_allocations" ADD CONSTRAINT "FK_43be4150dd27ee8609198826183" FOREIGN KEY ("refund_id") REFERENCES "refunds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_closure_payment_totals" ADD CONSTRAINT "FK_adc6098f98522d638f02e8d8400" FOREIGN KEY ("daily_closure_id") REFERENCES "daily_closures"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" ADD CONSTRAINT "FK_82a6ebf32576cb43cc53c2fc704" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_5222bf5540ed889dea0b3a9ba3a" FOREIGN KEY ("attention_id") REFERENCES "attentions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fulfillments" ADD CONSTRAINT "FK_4d8546da595cf28d3cfaa2dde30" FOREIGN KEY ("attention_id") REFERENCES "attentions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attention_participants" ADD CONSTRAINT "FK_9554285bdd0baf365ff06860fbc" FOREIGN KEY ("attention_id") REFERENCES "attentions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
