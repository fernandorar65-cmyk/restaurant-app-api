import { MigrationInterface, QueryRunner } from 'typeorm';

// Baseline: the 51-table schema as it stood before the first versioned
// migration (generated from the entities with synchronize semantics).

export class InitialSchema1761955200000 implements MigrationInterface {
  name = 'InitialSchema1761955200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Databases created before migrations existed were built by
    // synchronize with exactly this schema: adopt them as they are.
    const [{ exists }] = await queryRunner.query(
      `SELECT to_regclass('public.users') IS NOT NULL AS "exists"`,
    );
    if (exists) {
      return;
    }
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
    await queryRunner.query(
      `CREATE TABLE "attention_participants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "attention_id" uuid NOT NULL, "user_id" uuid, "guest_token" uuid, "display_name" character varying(120), "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "left_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "uq_participants_attention_guest" UNIQUE ("attention_id", "guest_token"), CONSTRAINT "uq_participants_attention_user" UNIQUE ("attention_id", "user_id"), CONSTRAINT "chk_participants_dates" CHECK (left_at IS NULL OR left_at >= joined_at), CONSTRAINT "chk_participants_identity" CHECK (user_id IS NOT NULL OR guest_token IS NOT NULL), CONSTRAINT "PK_882cc8e280e6ed83ff8ab4584e7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_participants_attention" ON "attention_participants"  ("attention_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "attentions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "restaurant_id" uuid NOT NULL, "dining_table_id" uuid, "customer_user_id" uuid, "attention_number" character varying(50) NOT NULL, "service_type" character varying(20) NOT NULL, "status" character varying(30) NOT NULL DEFAULT 'OPEN', "bill_requested_at" TIMESTAMP WITH TIME ZONE, "opened_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "closed_at" TIMESTAMP WITH TIME ZONE, "cancelled_at" TIMESTAMP WITH TIME ZONE, "cancellation_reason" character varying(500), "version" integer NOT NULL DEFAULT '0', CONSTRAINT "uq_attentions_restaurant_number" UNIQUE ("restaurant_id", "attention_number"), CONSTRAINT "chk_attentions_version" CHECK (version >= 0), CONSTRAINT "chk_attentions_dates" CHECK ((closed_at IS NULL OR closed_at >= opened_at) AND (cancelled_at IS NULL OR cancelled_at >= opened_at)), CONSTRAINT "chk_attentions_table_by_service" CHECK ((service_type = 'DINE_IN' AND dining_table_id IS NOT NULL) OR (service_type IN ('PICKUP', 'DELIVERY') AND dining_table_id IS NULL)), CONSTRAINT "chk_attentions_status" CHECK (status IN ('OPEN', 'BILL_REQUESTED', 'CLOSED', 'CANCELLED')), CONSTRAINT "chk_attentions_service_type" CHECK (service_type IN ('DINE_IN', 'PICKUP', 'DELIVERY')), CONSTRAINT "PK_5fc7685d43671aa780297ac64e4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_attentions_active_table" ON "attentions"  ("dining_table_id") WHERE dining_table_id IS NOT NULL AND status IN ('OPEN', 'BILL_REQUESTED')`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_attentions_customer" ON "attentions"  ("customer_user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_attentions_table" ON "attentions"  ("dining_table_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_attentions_restaurant_status" ON "attentions"  ("restaurant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "fulfillments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "attention_id" uuid NOT NULL, "type" character varying(20) NOT NULL, "status" character varying(30) NOT NULL DEFAULT 'PENDING', "customer_name" character varying(150) NOT NULL, "customer_phone" character varying(30) NOT NULL, "scheduled_at" TIMESTAMP WITH TIME ZONE, "estimated_ready_at" TIMESTAMP WITH TIME ZONE, "delivery_address" character varying(500), "delivery_reference" character varying(500), "latitude" numeric(9,6), "longitude" numeric(9,6), "delivery_fee" numeric(12,2) NOT NULL DEFAULT '0', "eat_at_restaurant" boolean, "delivered_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "uq_fulfillments_attention" UNIQUE ("attention_id"), CONSTRAINT "REL_4d8546da595cf28d3cfaa2dde3" UNIQUE ("attention_id"), CONSTRAINT "chk_fulfillments_longitude" CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180), CONSTRAINT "chk_fulfillments_latitude" CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90), CONSTRAINT "chk_fulfillments_delivery_data" CHECK (type <> 'DELIVERY' OR delivery_address IS NOT NULL), CONSTRAINT "chk_fulfillments_fee" CHECK (delivery_fee >= 0), CONSTRAINT "chk_fulfillments_status" CHECK (status IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED')), CONSTRAINT "chk_fulfillments_type" CHECK (type IN ('PICKUP', 'DELIVERY')), CONSTRAINT "PK_cb1805f0398d3d001737de76df3" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "attention_id" uuid NOT NULL, "request_id" uuid NOT NULL, "source" character varying(20) NOT NULL, "submitted_by_user_id" uuid, "submitted_by_participant_id" uuid, "status" character varying(20) NOT NULL DEFAULT 'SUBMITTED', "submitted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "confirmed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "uq_orders_attention_request" UNIQUE ("attention_id", "request_id"), CONSTRAINT "chk_orders_confirmed_at" CHECK (confirmed_at IS NULL OR confirmed_at >= submitted_at), CONSTRAINT "chk_orders_status" CHECK (status IN ('SUBMITTED', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED')), CONSTRAINT "chk_orders_source" CHECK (source IN ('CUSTOMER', 'WAITER')), CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_orders_attention_submitted" ON "orders"  ("attention_id", "submitted_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "order_item_status_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "order_item_id" uuid NOT NULL, "previous_status" character varying(20), "new_status" character varying(20) NOT NULL, "changed_by_user_id" uuid, "reason" character varying(500), "changed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "version_before" integer, CONSTRAINT "chk_item_history_version" CHECK (version_before IS NULL OR version_before >= 0), CONSTRAINT "chk_item_history_new" CHECK (new_status IN ('SUBMITTED', 'PREPARING', 'READY', 'DELIVERED', 'REJECTED', 'CANCELLED')), CONSTRAINT "chk_item_history_previous" CHECK (previous_status IS NULL OR previous_status IN ('SUBMITTED', 'PREPARING', 'READY', 'DELIVERED', 'REJECTED', 'CANCELLED')), CONSTRAINT "PK_ef543ea0cbafbf82a95dc24982f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_item_history_item_changed" ON "order_item_status_history"  ("order_item_id", "changed_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, "requested_by_participant_id" uuid, "product_name_snapshot" character varying(150) NOT NULL, "unit_price" numeric(12,2) NOT NULL, "quantity" integer NOT NULL, "subtotal" numeric(12,2) NOT NULL, "customer_note" character varying(500), "current_status" character varying(20) NOT NULL DEFAULT 'SUBMITTED', "rejection_reason" character varying(500), "version" integer NOT NULL DEFAULT '0', CONSTRAINT "chk_order_items_version" CHECK (version >= 0), CONSTRAINT "chk_order_items_rejection" CHECK (current_status <> 'REJECTED' OR rejection_reason IS NOT NULL), CONSTRAINT "chk_order_items_status" CHECK (current_status IN ('SUBMITTED', 'PREPARING', 'READY', 'DELIVERED', 'REJECTED', 'CANCELLED')), CONSTRAINT "chk_order_items_subtotal" CHECK (subtotal >= 0), CONSTRAINT "chk_order_items_quantity" CHECK (quantity > 0), CONSTRAINT "chk_order_items_price" CHECK (unit_price >= 0), CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_order_items_status" ON "order_items"  ("current_status", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_order_items_product" ON "order_items"  ("product_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_order_items_order" ON "order_items"  ("order_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "parent_category_id" uuid, "name" citext NOT NULL, "description" character varying(500), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "chk_categories_not_own_parent" CHECK (parent_category_id IS NULL OR parent_category_id <> id), CONSTRAINT "chk_categories_name_length" CHECK (char_length(name) BETWEEN 1 AND 100), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_categories_parent" ON "categories"  ("parent_category_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_categories_parent_name" ON "categories"  ("organization_id", "parent_category_id", "name") WHERE parent_category_id IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_categories_root_name" ON "categories"  ("organization_id", "name") WHERE parent_category_id IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "menu_products" ("menu_id" uuid NOT NULL, "product_id" uuid NOT NULL, "menu_section_id" uuid, "display_price" numeric(12,2), "sort_order" integer NOT NULL DEFAULT '0', "is_visible" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "chk_menu_products_price" CHECK (display_price IS NULL OR display_price >= 0), CONSTRAINT "PK_b8dfaafecddd73f2b5a6305b640" PRIMARY KEY ("menu_id", "product_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_menu_products_section" ON "menu_products"  ("menu_section_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_menu_products_product" ON "menu_products"  ("product_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "menus" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "restaurant_id" uuid NOT NULL, "name" character varying(150) NOT NULL, "description" character varying(500), "status" character varying(20) NOT NULL DEFAULT 'DRAFT', "valid_from" TIMESTAMP WITH TIME ZONE, "valid_until" TIMESTAMP WITH TIME ZONE, CONSTRAINT "uq_menus_restaurant_name" UNIQUE ("restaurant_id", "name"), CONSTRAINT "chk_menus_validity" CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from), CONSTRAINT "chk_menus_status" CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE')), CONSTRAINT "PK_3fec3d93327f4538e0cbd4349c4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_menus_restaurant_status" ON "menus"  ("restaurant_id", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "menu_sections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "menu_id" uuid NOT NULL, "category_id" uuid, "name" citext NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_menu_sections_menu_name" UNIQUE ("menu_id", "name"), CONSTRAINT "chk_menu_sections_name_length" CHECK (char_length(name) BETWEEN 1 AND 100), CONSTRAINT "PK_d9f9554edc03170cba756fecdb9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_menu_sections_menu_order" ON "menu_sections"  ("menu_id", "sort_order") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_categories" ("product_id" uuid NOT NULL, "category_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_54f2e1dbf14cfa770f59f0aac8f" PRIMARY KEY ("product_id", "category_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_product_categories_category" ON "product_categories"  ("category_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_ingredients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "product_id" uuid NOT NULL, "name" character varying(150) NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_visible" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_82b8cf241e3716a8d4682e79190" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "restaurant_id" uuid NOT NULL, "code" character varying(50) NOT NULL, "name" character varying(150) NOT NULL, "description" character varying(800), "image_url" character varying(1000), "price" numeric(12,2) NOT NULL, "preparation_minutes" integer, "is_available" boolean NOT NULL DEFAULT true, "is_takeaway_allowed" boolean NOT NULL DEFAULT true, "is_delivery_allowed" boolean NOT NULL DEFAULT true, "status" character varying(20) NOT NULL DEFAULT 'ACTIVE', CONSTRAINT "uq_products_restaurant_code" UNIQUE ("restaurant_id", "code"), CONSTRAINT "chk_products_status" CHECK (status IN ('ACTIVE', 'INACTIVE')), CONSTRAINT "chk_products_preparation" CHECK (preparation_minutes IS NULL OR preparation_minutes >= 0), CONSTRAINT "chk_products_price" CHECK (price >= 0), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_products_available" ON "products"  ("restaurant_id", "is_available", "status") `,
    );
    await queryRunner.query(
      `CREATE TABLE "daily_closure_payment_totals" ("daily_closure_id" uuid NOT NULL, "payment_method" character varying(30) NOT NULL, "amount" numeric(14,2) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "chk_closure_totals_amount" CHECK (amount >= 0), CONSTRAINT "chk_closure_totals_method" CHECK (payment_method IN ('CASH', 'CARD', 'YAPE', 'PLIN', 'BANK_TRANSFER', 'OTHER')), CONSTRAINT "PK_2719ad97425999cb4420acb87f3" PRIMARY KEY ("daily_closure_id", "payment_method"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "daily_closures" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "restaurant_id" uuid NOT NULL, "business_date" date NOT NULL, "opened_attentions" integer NOT NULL DEFAULT '0', "closed_attentions" integer NOT NULL DEFAULT '0', "cancelled_attentions" integer NOT NULL DEFAULT '0', "gross_sales" numeric(14,2) NOT NULL DEFAULT '0', "refunded_amount" numeric(14,2) NOT NULL DEFAULT '0', "net_sales" numeric(14,2) NOT NULL DEFAULT '0', "expense_amount" numeric(14,2) NOT NULL DEFAULT '0', "expected_cash" numeric(14,2) NOT NULL DEFAULT '0', "actual_cash" numeric(14,2), "difference_amount" numeric(14,2), "notes" character varying(1000), "closed_by_user_id" uuid NOT NULL, "closed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_daily_closures_restaurant_date" UNIQUE ("restaurant_id", "business_date"), CONSTRAINT "chk_daily_closures_amounts" CHECK (gross_sales >= 0 AND refunded_amount >= 0 AND expense_amount >= 0 AND expected_cash >= 0), CONSTRAINT "chk_daily_closures_counts" CHECK (opened_attentions >= 0 AND closed_attentions >= 0 AND cancelled_attentions >= 0), CONSTRAINT "PK_f51de8466fbd0833d41248b7006" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_daily_closures_restaurant_date" ON "daily_closures"  ("restaurant_id", "business_date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "expense_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "name" character varying(120) NOT NULL, "description" character varying(500), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_expense_categories_organization_name" UNIQUE ("organization_id", "name"), CONSTRAINT "PK_d0ef31e189d9523461215b62775" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_expense_categories_organization" ON "expense_categories"  ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "restaurant_id" uuid NOT NULL, "category_id" uuid NOT NULL, "inventory_movement_id" uuid, "description" character varying(500) NOT NULL, "amount" numeric(12,2) NOT NULL, "expense_date" date NOT NULL, "payment_method" character varying(30), "registered_by_user_id" uuid, "status" character varying(20) NOT NULL DEFAULT 'REGISTERED', CONSTRAINT "uq_expenses_inventory_movement" UNIQUE ("inventory_movement_id"), CONSTRAINT "REL_7bc3ff8f94e0c68d19a1d85526" UNIQUE ("inventory_movement_id"), CONSTRAINT "chk_expenses_status" CHECK (status IN ('REGISTERED', 'VOIDED')), CONSTRAINT "chk_expenses_method" CHECK (payment_method IS NULL OR payment_method IN ('CASH', 'CARD', 'YAPE', 'PLIN', 'BANK_TRANSFER', 'OTHER')), CONSTRAINT "chk_expenses_amount" CHECK (amount > 0), CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_expenses_restaurant_date" ON "expenses"  ("restaurant_id", "expense_date") `,
    );
    await queryRunner.query(
      `CREATE TABLE "customer_profiles" ("user_id" uuid NOT NULL, "dietary_preferences" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_99617dd6d452ad43dd992a79933" PRIMARY KEY ("user_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "token_hash" character varying(255) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "uq_password_reset_tokens_hash" UNIQUE ("token_hash"), CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "token_hash" character varying(255) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "organization_memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role_id" uuid NOT NULL, "all_restaurants" boolean NOT NULL DEFAULT false, "status" character varying(20) NOT NULL DEFAULT 'ACTIVE', "joined_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_memberships_organization_user" UNIQUE ("organization_id", "user_id"), CONSTRAINT "chk_memberships_status" CHECK (status IN ('ACTIVE', 'INACTIVE', 'INVITED', 'SUSPENDED')), CONSTRAINT "PK_cd7be805730a4c778a5f45364af" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_memberships_role" ON "organization_memberships"  ("role_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_memberships_user" ON "organization_memberships"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "code" character varying(100) NOT NULL, "name" character varying(120) NOT NULL, "description" character varying(500), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_permissions_code" UNIQUE ("code"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "role_permissions" ("role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "code" character varying(60) NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(500), "is_system" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_roles_organization_code" UNIQUE ("organization_id", "code"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_roles_organization" ON "roles"  ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100), "phone" character varying(30), "status" character varying(20) NOT NULL DEFAULT 'ACTIVE', "must_change_password" boolean NOT NULL DEFAULT false, "is_platform_admin" boolean NOT NULL DEFAULT false, "last_login_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "uq_users_email" UNIQUE ("email"), CONSTRAINT "chk_users_status" CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "name" citext NOT NULL, "description" character varying(500), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_inventory_categories_organization_name" UNIQUE ("organization_id", "name"), CONSTRAINT "chk_inventory_categories_name_length" CHECK (char_length(name) BETWEEN 1 AND 120), CONSTRAINT "PK_9903ce18e20acdba3c32c997dc7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_categories_organization" ON "inventory_categories"  ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_movement_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "code" character varying(30) NOT NULL, "name" character varying(100) NOT NULL, "effect" character varying(10) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_inventory_movement_types_code" UNIQUE ("code"), CONSTRAINT "chk_inventory_movement_types_effect" CHECK (effect IN ('INCREASE', 'DECREASE', 'CALCULATED')), CONSTRAINT "chk_inventory_movement_types_code" CHECK (code ~ '^[A-Z][A-Z_]*$'), CONSTRAINT "PK_ef48ab7f31903fb639122cfde0a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "restaurant_supplies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "restaurant_id" uuid NOT NULL, "supply_id" uuid NOT NULL, "current_quantity" numeric(14,3) NOT NULL DEFAULT '0', "minimum_quantity" numeric(14,3) NOT NULL DEFAULT '0', "average_unit_cost" numeric(14,4) NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_restaurant_supplies_restaurant_supply" UNIQUE ("restaurant_id", "supply_id"), CONSTRAINT "chk_restaurant_supplies_average_cost" CHECK (average_unit_cost >= 0), CONSTRAINT "chk_restaurant_supplies_minimum" CHECK (minimum_quantity >= 0), CONSTRAINT "chk_restaurant_supplies_current" CHECK (current_quantity >= 0), CONSTRAINT "PK_092d476877ae13aabb61ec66a33" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_restaurant_supplies_supply" ON "restaurant_supplies"  ("supply_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "units_of_measure" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "code" character varying(10) NOT NULL, "name" character varying(50) NOT NULL, "dimension" character varying(10) NOT NULL, "conversion_factor_to_base" numeric(18,6) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_units_of_measure_code" UNIQUE ("code"), CONSTRAINT "chk_units_of_measure_factor" CHECK (conversion_factor_to_base > 0), CONSTRAINT "chk_units_of_measure_dimension" CHECK (dimension IN ('MASS', 'VOLUME', 'UNIT')), CONSTRAINT "chk_units_of_measure_code" CHECK (code ~ '^[A-Z][A-Z_]*$'), CONSTRAINT "PK_ce93a9c86be10704b5415ca4bee" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inventory_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "sequence" BIGSERIAL NOT NULL, "restaurant_supply_id" uuid NOT NULL, "movement_type_id" uuid NOT NULL, "quantity_delta" numeric(14,3) NOT NULL, "previous_quantity" numeric(14,3) NOT NULL, "resulting_quantity" numeric(14,3) NOT NULL, "counted_quantity" numeric(14,3), "unit_cost" numeric(14,4), "notes" character varying(500), "origin_module" character varying(30), "origin_id" character varying(100), "idempotency_key" character varying(100), "created_by_user_id" uuid, "reversal_of_movement_id" uuid, CONSTRAINT "chk_inventory_movements_unit_cost" CHECK (unit_cost IS NULL OR unit_cost >= 0), CONSTRAINT "chk_inventory_movements_counted" CHECK (counted_quantity IS NULL OR counted_quantity >= 0), CONSTRAINT "chk_inventory_movements_balance" CHECK (previous_quantity >= 0 AND resulting_quantity >= 0 AND resulting_quantity = previous_quantity + quantity_delta), CONSTRAINT "chk_inventory_movements_delta" CHECK (quantity_delta <> 0), CONSTRAINT "PK_d7597827c1dcffae889db3ab873" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_inventory_movements_reversal" ON "inventory_movements"  ("reversal_of_movement_id") WHERE reversal_of_movement_id IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_inventory_movements_idempotency" ON "inventory_movements"  ("restaurant_supply_id", "idempotency_key") WHERE idempotency_key IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_movements_origin" ON "inventory_movements"  ("origin_module", "origin_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_movements_type" ON "inventory_movements"  ("movement_type_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_inventory_movements_supply_sequence" ON "inventory_movements"  ("restaurant_supply_id", "sequence") `,
    );
    await queryRunner.query(
      `CREATE TABLE "product_recipes" ("product_id" uuid NOT NULL, "supply_id" uuid NOT NULL, "quantity_required" numeric(14,3) NOT NULL, "waste_percentage" numeric(5,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "chk_recipes_waste" CHECK (waste_percentage BETWEEN 0 AND 100), CONSTRAINT "chk_recipes_quantity" CHECK (quantity_required > 0), CONSTRAINT "PK_45feac0f15bf1f7ff88d5d53723" PRIMARY KEY ("product_id", "supply_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_recipes_supply" ON "product_recipes"  ("supply_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "supplies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "category_id" uuid NOT NULL, "code" character varying(50) NOT NULL, "name" character varying(150) NOT NULL, "base_unit_id" uuid NOT NULL, "description" character varying(500), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_supplies_organization_code" UNIQUE ("organization_id", "code"), CONSTRAINT "PK_49c0dc272c9fcf2723bdfd48be1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_supplies_base_unit" ON "supplies"  ("base_unit_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_supplies_category" ON "supplies"  ("category_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "dining_tables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "restaurant_id" uuid NOT NULL, "floor_id" uuid NOT NULL, "code" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "capacity" integer, "operational_status" character varying(20) NOT NULL DEFAULT 'ACTIVE', "service_status" character varying(20) NOT NULL DEFAULT 'AVAILABLE', "position_x" numeric(10,2), "position_y" numeric(10,2), "qr_token_hash" character varying(64), "qr_version" integer, "qr_generated_at" TIMESTAMP WITH TIME ZONE, "qr_asset_url" character varying(1000), CONSTRAINT "uq_tables_qr_token_hash" UNIQUE ("qr_token_hash"), CONSTRAINT "uq_tables_restaurant_code" UNIQUE ("restaurant_id", "code"), CONSTRAINT "chk_tables_service_status" CHECK (service_status IN ('AVAILABLE', 'RESERVED', 'CLEANING')), CONSTRAINT "chk_tables_operational_status" CHECK (operational_status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')), CONSTRAINT "chk_tables_qr_consistency" CHECK (qr_token_hash IS NULL OR (qr_version IS NOT NULL AND qr_generated_at IS NOT NULL)), CONSTRAINT "chk_tables_qr_version" CHECK (qr_version IS NULL OR qr_version > 0), CONSTRAINT "chk_tables_capacity" CHECK (capacity IS NULL OR capacity > 0), CONSTRAINT "PK_30bc22c71f39a9d32b7f7617757" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tables_floor" ON "dining_tables"  ("floor_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "employees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "user_id" uuid, "employee_code" character varying(50) NOT NULL, "document_number" character varying(50), "job_position_id" uuid, "status" character varying(20) NOT NULL DEFAULT 'ACTIVE', "hired_at" date, "terminated_at" date, CONSTRAINT "uq_employees_organization_user" UNIQUE ("organization_id", "user_id"), CONSTRAINT "uq_employees_organization_code" UNIQUE ("organization_id", "employee_code"), CONSTRAINT "chk_employees_dates" CHECK (terminated_at IS NULL OR hired_at IS NULL OR terminated_at >= hired_at), CONSTRAINT "chk_employees_status" CHECK (status IN ('ACTIVE', 'INACTIVE', 'TERMINATED')), CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_employees_job_position" ON "employees"  ("job_position_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_employees_user" ON "employees"  ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "membership_restaurants" ("membership_id" uuid NOT NULL, "restaurant_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_924773c85f50ef7bc44f8919dd3" PRIMARY KEY ("membership_id", "restaurant_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_membership_restaurants_restaurant" ON "membership_restaurants"  ("restaurant_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(150) NOT NULL, "legal_name" character varying(200), "tax_identifier" character varying(50), "currency_code" character(3) NOT NULL DEFAULT 'PEN', "timezone" character varying(80) NOT NULL DEFAULT 'America/Lima', "status" character varying(20) NOT NULL DEFAULT 'ACTIVE', CONSTRAINT "uq_organizations_tax_identifier" UNIQUE ("tax_identifier"), CONSTRAINT "chk_organizations_status" CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "restaurant_floors" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "restaurant_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "sort_order" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_floors_restaurant_name" UNIQUE ("restaurant_id", "name"), CONSTRAINT "PK_d0b100ea382b1cc8fb2029deb3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_floors_restaurant" ON "restaurant_floors"  ("restaurant_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "restaurant_order_modes" ("restaurant_id" uuid NOT NULL, "mode" character varying(20) NOT NULL, "is_enabled" boolean NOT NULL DEFAULT true, "minimum_amount" numeric(12,2), "delivery_fee" numeric(12,2), "configuration_json" jsonb NOT NULL DEFAULT '{}'::jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "chk_order_modes_fee" CHECK (delivery_fee IS NULL OR delivery_fee >= 0), CONSTRAINT "chk_order_modes_minimum" CHECK (minimum_amount IS NULL OR minimum_amount >= 0), CONSTRAINT "chk_order_modes_mode" CHECK (mode IN ('DINE_IN', 'PICKUP', 'DELIVERY')), CONSTRAINT "PK_8df14fd6201fe1fd4c86cb94697" PRIMARY KEY ("restaurant_id", "mode"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "restaurants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "code" character varying(50) NOT NULL, "slug" character varying(180) NOT NULL, "name" character varying(150) NOT NULL, "description" character varying(500), "address" character varying(300), "phone" character varying(30), "email" character varying(255), "latitude" numeric(9,6), "longitude" numeric(9,6), "currency_code" character(3) NOT NULL DEFAULT 'PEN', "timezone" character varying(80) NOT NULL DEFAULT 'America/Lima', "status" character varying(20) NOT NULL DEFAULT 'ACTIVE', CONSTRAINT "uq_restaurants_slug" UNIQUE ("slug"), CONSTRAINT "uq_restaurants_organization_code" UNIQUE ("organization_id", "code"), CONSTRAINT "chk_restaurants_longitude" CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180), CONSTRAINT "chk_restaurants_latitude" CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90), CONSTRAINT "chk_restaurants_status" CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED')), CONSTRAINT "PK_e2133a72eb1cc8f588f7b503e68" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_restaurants_organization" ON "restaurants"  ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "job_positions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "work_area_id" uuid NOT NULL, "name" citext NOT NULL, "description" character varying(500), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_job_positions_organization_area_name" UNIQUE ("organization_id", "work_area_id", "name"), CONSTRAINT "chk_job_positions_name_length" CHECK (char_length(name) BETWEEN 1 AND 100), CONSTRAINT "PK_647b08f0ec097a17f8fff8adfb9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_job_positions_work_area" ON "job_positions"  ("work_area_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_job_positions_organization" ON "job_positions"  ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "work_areas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "name" citext NOT NULL, "description" character varying(500), "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_work_areas_organization_name" UNIQUE ("organization_id", "name"), CONSTRAINT "chk_work_areas_name_length" CHECK (char_length(name) BETWEEN 1 AND 100), CONSTRAINT "PK_50b32ea86ee7096cc58345f887e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_work_areas_organization" ON "work_areas"  ("organization_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_provider_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider_code" character varying(50) NOT NULL, "event_id" character varying(255) NOT NULL, "event_type" character varying(100) NOT NULL, "provider_payment_id" character varying(255), "external_status" character varying(100), "payload" jsonb NOT NULL DEFAULT '{}'::jsonb, "payment_id" uuid, "received_at" TIMESTAMP WITH TIME ZONE NOT NULL, "processed_at" TIMESTAMP WITH TIME ZONE, "result" character varying(20), "result_message" character varying(500), CONSTRAINT "uq_payment_provider_events_event" UNIQUE ("provider_code", "event_id"), CONSTRAINT "chk_payment_provider_events_result" CHECK (result IS NULL OR result IN ('PROCESSED', 'IGNORED', 'FAILED')), CONSTRAINT "PK_e94b23836002f2a07a3046ed2e4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payment_provider_events_received" ON "payment_provider_events"  ("provider_code", "received_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payment_provider_events_payment" ON "payment_provider_events"  ("payment_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_provider_status_mappings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "provider_code" character varying(50) NOT NULL, "external_status" citext NOT NULL, "payment_status_id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_payment_provider_mappings_status" UNIQUE ("provider_code", "external_status"), CONSTRAINT "PK_dc0f82cb08be0f2deac8463f906" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payment_provider_mappings_status" ON "payment_provider_status_mappings"  ("payment_status_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_statuses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "code" character varying(30) NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(500), "is_terminal" boolean NOT NULL, "counts_toward_balance" boolean NOT NULL, "allows_refund" boolean NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_payment_statuses_code" UNIQUE ("code"), CONSTRAINT "chk_payment_statuses_code" CHECK (code ~ '^[A-Z][A-Z_]*$'), CONSTRAINT "PK_de2e33567a948ee108070d1d241" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "refund_allocations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "refund_id" uuid NOT NULL, "payment_allocation_id" uuid NOT NULL, "refunded_amount" numeric(12,2) NOT NULL, CONSTRAINT "uq_refund_allocations_refund_allocation" UNIQUE ("refund_id", "payment_allocation_id"), CONSTRAINT "chk_refund_allocations_amount" CHECK (refunded_amount > 0), CONSTRAINT "PK_a01bf9ec538f37964d03110bb56" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refund_allocations_payment_allocation" ON "refund_allocations"  ("payment_allocation_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "refund_provider_status_mappings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "provider_code" character varying(50) NOT NULL, "external_status" citext NOT NULL, "refund_status_id" uuid NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_refund_provider_mappings_status" UNIQUE ("provider_code", "external_status"), CONSTRAINT "PK_c4a7644b2997bcedb5b594ab19e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refund_provider_mappings_status" ON "refund_provider_status_mappings"  ("refund_status_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "refund_statuses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "code" character varying(30) NOT NULL, "name" character varying(100) NOT NULL, "description" character varying(500), "is_terminal" boolean NOT NULL, "counts_as_refunded" boolean NOT NULL, "is_active" boolean NOT NULL DEFAULT true, CONSTRAINT "uq_refund_statuses_code" UNIQUE ("code"), CONSTRAINT "chk_refund_statuses_code" CHECK (code ~ '^[A-Z][A-Z_]*$'), CONSTRAINT "PK_2d1aabac2093e4196a9d4b8e868" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_allocations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "payment_id" uuid NOT NULL, "concept" character varying(20) NOT NULL, "order_item_id" uuid, "allocated_amount" numeric(12,2) NOT NULL, CONSTRAINT "uq_allocations_payment_item" UNIQUE ("payment_id", "order_item_id"), CONSTRAINT "chk_allocations_target" CHECK ((concept = 'ORDER_ITEM') = (order_item_id IS NOT NULL)), CONSTRAINT "chk_allocations_concept" CHECK (concept IN ('ORDER_ITEM', 'DELIVERY_FEE')), CONSTRAINT "chk_allocations_amount" CHECK (allocated_amount > 0), CONSTRAINT "PK_a5c6ff22065ac772620c85f4efb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_allocations_order_item" ON "payment_allocations"  ("order_item_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_allocations_payment_delivery_fee" ON "payment_allocations"  ("payment_id") WHERE concept = 'DELIVERY_FEE'`,
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "organization_id" uuid NOT NULL, "restaurant_id" uuid NOT NULL, "attention_id" uuid NOT NULL, "payment_status_id" uuid NOT NULL, "payment_method" character varying(30) NOT NULL, "allocation_mode" character varying(10) NOT NULL, "amount" numeric(12,2) NOT NULL, "currency_code" character(3) NOT NULL, "payer_user_id" uuid, "payer_name" character varying(150), "external_reference" character varying(255), "provider_code" character varying(50), "provider_payment_id" character varying(255), "provider_status" character varying(100), "request_id" uuid NOT NULL, "notes" character varying(500), "paid_at" TIMESTAMP WITH TIME ZONE, "registered_by_user_id" uuid, CONSTRAINT "uq_payments_restaurant_request" UNIQUE ("restaurant_id", "request_id"), CONSTRAINT "chk_payments_provider" CHECK (provider_code IS NOT NULL OR (provider_payment_id IS NULL AND provider_status IS NULL)), CONSTRAINT "chk_payments_mode" CHECK (allocation_mode IN ('ITEMS', 'FULL', 'AMOUNT')), CONSTRAINT "chk_payments_method" CHECK (payment_method IN ('CASH', 'CARD', 'YAPE', 'PLIN', 'BANK_TRANSFER', 'OTHER')), CONSTRAINT "chk_payments_amount" CHECK (amount > 0), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_payments_provider_payment" ON "payments"  ("provider_code", "provider_payment_id") WHERE provider_payment_id IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payments_status" ON "payments"  ("payment_status_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payments_restaurant_paid_at" ON "payments"  ("restaurant_id", "paid_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_payments_attention" ON "payments"  ("attention_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "refunds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "payment_id" uuid NOT NULL, "refund_status_id" uuid NOT NULL, "amount" numeric(12,2) NOT NULL, "reason" character varying(500) NOT NULL, "provider_code" character varying(50), "provider_refund_id" character varying(255), "provider_status" character varying(100), "request_id" uuid NOT NULL, "processed_by_user_id" uuid, "completed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "uq_refunds_payment_request" UNIQUE ("payment_id", "request_id"), CONSTRAINT "chk_refunds_provider" CHECK (provider_code IS NOT NULL OR (provider_refund_id IS NULL AND provider_status IS NULL)), CONSTRAINT "chk_refunds_amount" CHECK (amount > 0), CONSTRAINT "PK_5106efb01eeda7e49a78b869738" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_refunds_provider_refund" ON "refunds"  ("provider_code", "provider_refund_id") WHERE provider_refund_id IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refunds_payment" ON "refunds"  ("payment_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "error_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "level" character varying(10) NOT NULL, "source" character varying(100), "message" text NOT NULL, "stack" text, "request_id" character varying(64), "method" character varying(10), "path" character varying(500), "status_code" smallint, "error_code" character varying(100), "user_id" uuid, CONSTRAINT "chk_error_logs_level" CHECK (level IN ('error', 'fatal')), CONSTRAINT "PK_6840885d7eb78406fa7d358be72" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_error_logs_request_id" ON "error_logs"  ("request_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_error_logs_created_at" ON "error_logs"  ("created_at") `,
    );
    await queryRunner.query(
      `ALTER TABLE "attention_participants" ADD CONSTRAINT "FK_9554285bdd0baf365ff06860fbc" FOREIGN KEY ("attention_id") REFERENCES "attentions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attention_participants" ADD CONSTRAINT "FK_86a213ba8745c98c368112eabdc" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" ADD CONSTRAINT "FK_d55c8bac287cfb7fa0ff93b3316" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" ADD CONSTRAINT "FK_973e9c99bbf920962a9bee9b094" FOREIGN KEY ("dining_table_id") REFERENCES "dining_tables"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" ADD CONSTRAINT "FK_cefa72735d7bf61823a4ba98922" FOREIGN KEY ("customer_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fulfillments" ADD CONSTRAINT "FK_4d8546da595cf28d3cfaa2dde30" FOREIGN KEY ("attention_id") REFERENCES "attentions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_5222bf5540ed889dea0b3a9ba3a" FOREIGN KEY ("attention_id") REFERENCES "attentions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_058a564890ea79dff2999e1e434" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_8058b6a305fb7a407cb54a432b8" FOREIGN KEY ("submitted_by_participant_id") REFERENCES "attention_participants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" ADD CONSTRAINT "FK_82a6ebf32576cb43cc53c2fc704" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" ADD CONSTRAINT "FK_8e34ec45bc2655e3ea3abf94433" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_9b0fb8893ddd1f38d4aef9c8a00" FOREIGN KEY ("requested_by_participant_id") REFERENCES "attention_participants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_bfac25cac85a4c76e896d5cfa16" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_de08738901be6b34d2824a1e243" FOREIGN KEY ("parent_category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "menu_products" ADD CONSTRAINT "FK_20ea1121a6054b292017fcf6aa9" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "menu_products" ADD CONSTRAINT "FK_2f6a9884047971d292da3e5e621" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "menu_products" ADD CONSTRAINT "FK_d34f0f2b8b787cea376248b9b29" FOREIGN KEY ("menu_section_id") REFERENCES "menu_sections"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "menus" ADD CONSTRAINT "FK_bcd4a935c967cc9c20e770d1e62" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "menu_sections" ADD CONSTRAINT "FK_db530f93c31aa1efc8e61c68345" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "menu_sections" ADD CONSTRAINT "FK_0662d32c9d45662837b2f6fa7fb" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD CONSTRAINT "FK_8748b4a0e8de6d266f2bbc877f6" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" ADD CONSTRAINT "FK_9148da8f26fc248e77a387e3112" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_ingredients" ADD CONSTRAINT "FK_04c6e59f037eb2a72ca672d44f5" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_81ac8c38c90887ea5f4a8d160dd" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_closure_payment_totals" ADD CONSTRAINT "FK_adc6098f98522d638f02e8d8400" FOREIGN KEY ("daily_closure_id") REFERENCES "daily_closures"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_closures" ADD CONSTRAINT "FK_53f2513e2fdff64366266e5fdca" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_closures" ADD CONSTRAINT "FK_951a368c9faa2ab1f7298f16942" FOREIGN KEY ("closed_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_categories" ADD CONSTRAINT "FK_a713916d96f313cb62dd563df19" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_7f90223fc2002b3ebdfe5b1ec87" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_5d1f4be708e0dfe2afa1a3c376c" FOREIGN KEY ("category_id") REFERENCES "expense_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_7bc3ff8f94e0c68d19a1d855266" FOREIGN KEY ("inventory_movement_id") REFERENCES "inventory_movements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_2c363cdf5be9695f6b557f49833" FOREIGN KEY ("registered_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_profiles" ADD CONSTRAINT "FK_99617dd6d452ad43dd992a79933" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_memberships" ADD CONSTRAINT "FK_86ae2efbb9ce84dd652e0c96a49" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_memberships" ADD CONSTRAINT "FK_5352fc550034d507d6c76dd2901" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_memberships" ADD CONSTRAINT "FK_153ee52445389b67ad7d6132478" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD CONSTRAINT "FK_c328a1ecd12a5f153a96df4509e" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_categories" ADD CONSTRAINT "FK_c3bc041aa23787e6666bda0e2b4" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_supplies" ADD CONSTRAINT "FK_b41effb0845f9df20516ca7b145" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_supplies" ADD CONSTRAINT "FK_16da6c64f4cf188ee62bf2792ed" FOREIGN KEY ("supply_id") REFERENCES "supplies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_cb8db435b34eacf3342944ba93c" FOREIGN KEY ("restaurant_supply_id") REFERENCES "restaurant_supplies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_61d24dc9ba5e0ee97db97139fa9" FOREIGN KEY ("movement_type_id") REFERENCES "inventory_movement_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_cd39fb940dfc48cb4d3c7ce14fc" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_2439efb320e970c7b8605a8ba98" FOREIGN KEY ("reversal_of_movement_id") REFERENCES "inventory_movements"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_recipes" ADD CONSTRAINT "FK_7b65dbb27e7a31f561d1712cfee" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_recipes" ADD CONSTRAINT "FK_0d77f4174500ffee04c8c528c74" FOREIGN KEY ("supply_id") REFERENCES "supplies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplies" ADD CONSTRAINT "FK_5bc02d95509468ba6a76a6c459a" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplies" ADD CONSTRAINT "FK_59589e06003348b05247ee482a4" FOREIGN KEY ("category_id") REFERENCES "inventory_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplies" ADD CONSTRAINT "FK_1647bb9a2c7d4ea7df56f8adace" FOREIGN KEY ("base_unit_id") REFERENCES "units_of_measure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dining_tables" ADD CONSTRAINT "FK_5376948f0c5b15f4f67d6d62d90" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "dining_tables" ADD CONSTRAINT "FK_840cf8eed69c2c8bb7216c98d88" FOREIGN KEY ("floor_id") REFERENCES "restaurant_floors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD CONSTRAINT "FK_3d3bc4729062b93fb56b084d786" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD CONSTRAINT "FK_2d83c53c3e553a48dadb9722e38" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ADD CONSTRAINT "FK_caf14aed7ed1a41280f9e903a10" FOREIGN KEY ("job_position_id") REFERENCES "job_positions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_restaurants" ADD CONSTRAINT "FK_602a7869bd821e80107d16c3e06" FOREIGN KEY ("membership_id") REFERENCES "organization_memberships"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_restaurants" ADD CONSTRAINT "FK_833f709006099f6bc21b9a0c1ef" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_floors" ADD CONSTRAINT "FK_5c3662f1b911c8523b08249472b" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_order_modes" ADD CONSTRAINT "FK_c4a96d2303d78243ded2bfb03e9" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurants" ADD CONSTRAINT "FK_5a23a15034bbb14a44d7d14bc74" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_positions" ADD CONSTRAINT "FK_3728d532b64e5a2b37b54977b59" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_positions" ADD CONSTRAINT "FK_f88790ab6aedecf08012d089c34" FOREIGN KEY ("work_area_id") REFERENCES "work_areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_areas" ADD CONSTRAINT "FK_d511668d6bd4b7cd810e2f617dc" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_provider_events" ADD CONSTRAINT "FK_db3638adc0eab132d87cbc37f34" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_provider_status_mappings" ADD CONSTRAINT "FK_4c25f43b8f22ba6e437824aecd6" FOREIGN KEY ("payment_status_id") REFERENCES "payment_statuses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refund_allocations" ADD CONSTRAINT "FK_43be4150dd27ee8609198826183" FOREIGN KEY ("refund_id") REFERENCES "refunds"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refund_allocations" ADD CONSTRAINT "FK_cdcccb7dcbdae7574bfca4cd15f" FOREIGN KEY ("payment_allocation_id") REFERENCES "payment_allocations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refund_provider_status_mappings" ADD CONSTRAINT "FK_d20b0c3500c8429640c45f354a9" FOREIGN KEY ("refund_status_id") REFERENCES "refund_statuses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_allocations" ADD CONSTRAINT "FK_4348f49c6822420b9503ba880b8" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_554edc6d57ad7e4224865e3c396" FOREIGN KEY ("payment_status_id") REFERENCES "payment_statuses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "FK_7f48aa5d56c42aeb495db016683" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" ADD CONSTRAINT "FK_ef5fdc02fc14ffce5a143694e6c" FOREIGN KEY ("refund_status_id") REFERENCES "refund_statuses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP CONSTRAINT "FK_ef5fdc02fc14ffce5a143694e6c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refunds" DROP CONSTRAINT "FK_7f48aa5d56c42aeb495db016683"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_554edc6d57ad7e4224865e3c396"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_allocations" DROP CONSTRAINT "FK_4348f49c6822420b9503ba880b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refund_provider_status_mappings" DROP CONSTRAINT "FK_d20b0c3500c8429640c45f354a9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refund_allocations" DROP CONSTRAINT "FK_cdcccb7dcbdae7574bfca4cd15f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refund_allocations" DROP CONSTRAINT "FK_43be4150dd27ee8609198826183"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_provider_status_mappings" DROP CONSTRAINT "FK_4c25f43b8f22ba6e437824aecd6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_provider_events" DROP CONSTRAINT "FK_db3638adc0eab132d87cbc37f34"`,
    );
    await queryRunner.query(
      `ALTER TABLE "work_areas" DROP CONSTRAINT "FK_d511668d6bd4b7cd810e2f617dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_positions" DROP CONSTRAINT "FK_f88790ab6aedecf08012d089c34"`,
    );
    await queryRunner.query(
      `ALTER TABLE "job_positions" DROP CONSTRAINT "FK_3728d532b64e5a2b37b54977b59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurants" DROP CONSTRAINT "FK_5a23a15034bbb14a44d7d14bc74"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_order_modes" DROP CONSTRAINT "FK_c4a96d2303d78243ded2bfb03e9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_floors" DROP CONSTRAINT "FK_5c3662f1b911c8523b08249472b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_restaurants" DROP CONSTRAINT "FK_833f709006099f6bc21b9a0c1ef"`,
    );
    await queryRunner.query(
      `ALTER TABLE "membership_restaurants" DROP CONSTRAINT "FK_602a7869bd821e80107d16c3e06"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" DROP CONSTRAINT "FK_caf14aed7ed1a41280f9e903a10"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" DROP CONSTRAINT "FK_2d83c53c3e553a48dadb9722e38"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" DROP CONSTRAINT "FK_3d3bc4729062b93fb56b084d786"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dining_tables" DROP CONSTRAINT "FK_840cf8eed69c2c8bb7216c98d88"`,
    );
    await queryRunner.query(
      `ALTER TABLE "dining_tables" DROP CONSTRAINT "FK_5376948f0c5b15f4f67d6d62d90"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplies" DROP CONSTRAINT "FK_1647bb9a2c7d4ea7df56f8adace"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplies" DROP CONSTRAINT "FK_59589e06003348b05247ee482a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "supplies" DROP CONSTRAINT "FK_5bc02d95509468ba6a76a6c459a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_recipes" DROP CONSTRAINT "FK_0d77f4174500ffee04c8c528c74"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_recipes" DROP CONSTRAINT "FK_7b65dbb27e7a31f561d1712cfee"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_2439efb320e970c7b8605a8ba98"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_cd39fb940dfc48cb4d3c7ce14fc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_61d24dc9ba5e0ee97db97139fa9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_cb8db435b34eacf3342944ba93c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_supplies" DROP CONSTRAINT "FK_16da6c64f4cf188ee62bf2792ed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "restaurant_supplies" DROP CONSTRAINT "FK_b41effb0845f9df20516ca7b145"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inventory_categories" DROP CONSTRAINT "FK_c3bc041aa23787e6666bda0e2b4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP CONSTRAINT "FK_c328a1ecd12a5f153a96df4509e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_memberships" DROP CONSTRAINT "FK_153ee52445389b67ad7d6132478"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_memberships" DROP CONSTRAINT "FK_5352fc550034d507d6c76dd2901"`,
    );
    await queryRunner.query(
      `ALTER TABLE "organization_memberships" DROP CONSTRAINT "FK_86ae2efbb9ce84dd652e0c96a49"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_52ac39dd8a28730c63aeb428c9c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "customer_profiles" DROP CONSTRAINT "FK_99617dd6d452ad43dd992a79933"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_2c363cdf5be9695f6b557f49833"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_7bc3ff8f94e0c68d19a1d855266"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_5d1f4be708e0dfe2afa1a3c376c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_7f90223fc2002b3ebdfe5b1ec87"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expense_categories" DROP CONSTRAINT "FK_a713916d96f313cb62dd563df19"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_closures" DROP CONSTRAINT "FK_951a368c9faa2ab1f7298f16942"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_closures" DROP CONSTRAINT "FK_53f2513e2fdff64366266e5fdca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_closure_payment_totals" DROP CONSTRAINT "FK_adc6098f98522d638f02e8d8400"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_81ac8c38c90887ea5f4a8d160dd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_ingredients" DROP CONSTRAINT "FK_04c6e59f037eb2a72ca672d44f5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP CONSTRAINT "FK_9148da8f26fc248e77a387e3112"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_categories" DROP CONSTRAINT "FK_8748b4a0e8de6d266f2bbc877f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "menu_sections" DROP CONSTRAINT "FK_0662d32c9d45662837b2f6fa7fb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "menu_sections" DROP CONSTRAINT "FK_db530f93c31aa1efc8e61c68345"`,
    );
    await queryRunner.query(
      `ALTER TABLE "menus" DROP CONSTRAINT "FK_bcd4a935c967cc9c20e770d1e62"`,
    );
    await queryRunner.query(
      `ALTER TABLE "menu_products" DROP CONSTRAINT "FK_d34f0f2b8b787cea376248b9b29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "menu_products" DROP CONSTRAINT "FK_2f6a9884047971d292da3e5e621"`,
    );
    await queryRunner.query(
      `ALTER TABLE "menu_products" DROP CONSTRAINT "FK_20ea1121a6054b292017fcf6aa9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_de08738901be6b34d2824a1e243"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_bfac25cac85a4c76e896d5cfa16"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_9b0fb8893ddd1f38d4aef9c8a00"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" DROP CONSTRAINT "FK_8e34ec45bc2655e3ea3abf94433"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_item_status_history" DROP CONSTRAINT "FK_82a6ebf32576cb43cc53c2fc704"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_8058b6a305fb7a407cb54a432b8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_058a564890ea79dff2999e1e434"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_5222bf5540ed889dea0b3a9ba3a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fulfillments" DROP CONSTRAINT "FK_4d8546da595cf28d3cfaa2dde30"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" DROP CONSTRAINT "FK_cefa72735d7bf61823a4ba98922"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" DROP CONSTRAINT "FK_973e9c99bbf920962a9bee9b094"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attentions" DROP CONSTRAINT "FK_d55c8bac287cfb7fa0ff93b3316"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attention_participants" DROP CONSTRAINT "FK_86a213ba8745c98c368112eabdc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attention_participants" DROP CONSTRAINT "FK_9554285bdd0baf365ff06860fbc"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_error_logs_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."idx_error_logs_request_id"`);
    await queryRunner.query(`DROP TABLE "error_logs"`);
    await queryRunner.query(`DROP INDEX "public"."idx_refunds_payment"`);
    await queryRunner.query(`DROP INDEX "public"."uq_refunds_provider_refund"`);
    await queryRunner.query(`DROP TABLE "refunds"`);
    await queryRunner.query(`DROP INDEX "public"."idx_payments_attention"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_payments_restaurant_paid_at"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_payments_status"`);
    await queryRunner.query(
      `DROP INDEX "public"."uq_payments_provider_payment"`,
    );
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(
      `DROP INDEX "public"."uq_allocations_payment_delivery_fee"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_allocations_order_item"`);
    await queryRunner.query(`DROP TABLE "payment_allocations"`);
    await queryRunner.query(`DROP TABLE "refund_statuses"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_refund_provider_mappings_status"`,
    );
    await queryRunner.query(`DROP TABLE "refund_provider_status_mappings"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_refund_allocations_payment_allocation"`,
    );
    await queryRunner.query(`DROP TABLE "refund_allocations"`);
    await queryRunner.query(`DROP TABLE "payment_statuses"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_payment_provider_mappings_status"`,
    );
    await queryRunner.query(`DROP TABLE "payment_provider_status_mappings"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_payment_provider_events_payment"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_payment_provider_events_received"`,
    );
    await queryRunner.query(`DROP TABLE "payment_provider_events"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_work_areas_organization"`,
    );
    await queryRunner.query(`DROP TABLE "work_areas"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_job_positions_organization"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_job_positions_work_area"`,
    );
    await queryRunner.query(`DROP TABLE "job_positions"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_restaurants_organization"`,
    );
    await queryRunner.query(`DROP TABLE "restaurants"`);
    await queryRunner.query(`DROP TABLE "restaurant_order_modes"`);
    await queryRunner.query(`DROP INDEX "public"."idx_floors_restaurant"`);
    await queryRunner.query(`DROP TABLE "restaurant_floors"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_membership_restaurants_restaurant"`,
    );
    await queryRunner.query(`DROP TABLE "membership_restaurants"`);
    await queryRunner.query(`DROP INDEX "public"."idx_employees_user"`);
    await queryRunner.query(`DROP INDEX "public"."idx_employees_job_position"`);
    await queryRunner.query(`DROP TABLE "employees"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tables_floor"`);
    await queryRunner.query(`DROP TABLE "dining_tables"`);
    await queryRunner.query(`DROP INDEX "public"."idx_supplies_category"`);
    await queryRunner.query(`DROP INDEX "public"."idx_supplies_base_unit"`);
    await queryRunner.query(`DROP TABLE "supplies"`);
    await queryRunner.query(`DROP INDEX "public"."idx_recipes_supply"`);
    await queryRunner.query(`DROP TABLE "product_recipes"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_movements_supply_sequence"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_movements_type"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_movements_origin"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."uq_inventory_movements_idempotency"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."uq_inventory_movements_reversal"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_movements"`);
    await queryRunner.query(`DROP TABLE "units_of_measure"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_restaurant_supplies_supply"`,
    );
    await queryRunner.query(`DROP TABLE "restaurant_supplies"`);
    await queryRunner.query(`DROP TABLE "inventory_movement_types"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_inventory_categories_organization"`,
    );
    await queryRunner.query(`DROP TABLE "inventory_categories"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP INDEX "public"."idx_roles_organization"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP INDEX "public"."idx_memberships_user"`);
    await queryRunner.query(`DROP INDEX "public"."idx_memberships_role"`);
    await queryRunner.query(`DROP TABLE "organization_memberships"`);
    await queryRunner.query(`DROP INDEX "public"."idx_refresh_tokens_user"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    await queryRunner.query(`DROP TABLE "customer_profiles"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_expenses_restaurant_date"`,
    );
    await queryRunner.query(`DROP TABLE "expenses"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_expense_categories_organization"`,
    );
    await queryRunner.query(`DROP TABLE "expense_categories"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_daily_closures_restaurant_date"`,
    );
    await queryRunner.query(`DROP TABLE "daily_closures"`);
    await queryRunner.query(`DROP TABLE "daily_closure_payment_totals"`);
    await queryRunner.query(`DROP INDEX "public"."idx_products_available"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "product_ingredients"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_product_categories_category"`,
    );
    await queryRunner.query(`DROP TABLE "product_categories"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_menu_sections_menu_order"`,
    );
    await queryRunner.query(`DROP TABLE "menu_sections"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_menus_restaurant_status"`,
    );
    await queryRunner.query(`DROP TABLE "menus"`);
    await queryRunner.query(`DROP INDEX "public"."idx_menu_products_product"`);
    await queryRunner.query(`DROP INDEX "public"."idx_menu_products_section"`);
    await queryRunner.query(`DROP TABLE "menu_products"`);
    await queryRunner.query(`DROP INDEX "public"."uq_categories_root_name"`);
    await queryRunner.query(`DROP INDEX "public"."uq_categories_parent_name"`);
    await queryRunner.query(`DROP INDEX "public"."idx_categories_parent"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP INDEX "public"."idx_order_items_order"`);
    await queryRunner.query(`DROP INDEX "public"."idx_order_items_product"`);
    await queryRunner.query(`DROP INDEX "public"."idx_order_items_status"`);
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_item_history_item_changed"`,
    );
    await queryRunner.query(`DROP TABLE "order_item_status_history"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_orders_attention_submitted"`,
    );
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TABLE "fulfillments"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_attentions_restaurant_status"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_attentions_table"`);
    await queryRunner.query(`DROP INDEX "public"."idx_attentions_customer"`);
    await queryRunner.query(`DROP INDEX "public"."uq_attentions_active_table"`);
    await queryRunner.query(`DROP TABLE "attentions"`);
    await queryRunner.query(`DROP INDEX "public"."idx_participants_attention"`);
    await queryRunner.query(`DROP TABLE "attention_participants"`);
  }
}
