import { NestFactory } from '@nestjs/core';
import type { INestApplicationContext } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ServiceTypesService } from '../../src/attention/application/attention-settings/service-types.service.js';
import { WorkflowStatusesService } from '../../src/attention/application/attention-settings/workflow-statuses.service.js';
import { AttentionsService } from '../../src/attention/application/attentions/attentions.service.js';
import { OrderItemsService } from '../../src/attention/application/order-items/order-items.service.js';
import { OrdersService } from '../../src/attention/application/orders/orders.service.js';
import { AttentionStatus } from '../../src/attention/domain/enums/attention-status.enum.js';
import { FulfillmentMode } from '../../src/attention/domain/enums/fulfillment-mode.enum.js';
import { OrderSource } from '../../src/attention/domain/enums/order-source.enum.js';
import { OrderStatus } from '../../src/attention/domain/enums/order-status.enum.js';
import {
  InvalidServiceSetupError,
  RequiredWorkflowStatusError,
  WorkflowStatusNotFoundError,
} from '../../src/attention/domain/exceptions/attention.errors.js';
import { WorkflowKind } from '../../src/attention/domain/workflows.js';
import { ProductsService } from '../../src/catalog/application/products/products.service.js';
import { PaymentMethod } from '../../src/common/domain/payment-method.enum.js';
import { DiningTablesService } from '../../src/organizations/application/dining-tables/dining-tables.service.js';
import { OrganizationsService } from '../../src/organizations/application/organizations/organizations.service.js';
import { RestaurantFloorsService } from '../../src/organizations/application/restaurant-floors/restaurant-floors.service.js';
import { RestaurantsService } from '../../src/organizations/application/restaurants/restaurants.service.js';
import { PaymentsService } from '../../src/payments/application/payments/payments.service.js';
import { AllocationConcept } from '../../src/payments/domain/enums/allocation-concept.enum.js';
import { AllocationMode } from '../../src/payments/domain/enums/allocation-mode.enum.js';
import { NothingToPayError } from '../../src/payments/domain/exceptions/payment.errors.js';
import {
  createTestDatabase,
  type TestDatabase,
} from '../support/test-database.js';

// Business rules of the configurable catalogs, against a database built by
// the migrations and the real application services.
describe('Configurable statuses and service types', () => {
  let database: TestDatabase;
  let app: INestApplicationContext;
  let previousDatabase: string | undefined;

  const get = <T>(type: new (...args: never[]) => T): T => app.get(type);

  beforeAll(async () => {
    database = await createTestDatabase('restaurant_api_catalogs');
    previousDatabase = process.env.DB_DATABASE;
    process.env.DB_DATABASE = database.name;
    // Imported only now: ConfigModule.forRoot reads the environment when the
    // module is first loaded.
    const { AppModule } = await import('../../src/app.module.js');
    app = await NestFactory.createApplicationContext(AppModule, {
      logger: false,
    });
  });

  afterAll(async () => {
    await app?.close();
    process.env.DB_DATABASE = previousDatabase;
    await database?.drop();
  });

  async function createRestaurant(name: string) {
    const organization = await get(OrganizationsService).create({
      name: `Org ${name}`,
    });
    const restaurant = await get(RestaurantsService).create({
      organizationId: organization.id,
      name,
    });
    const floor = await get(RestaurantFloorsService).create({
      restaurantId: restaurant.id,
      name: 'Salón',
    });
    const table = await get(DiningTablesService).create({
      floorId: floor.id,
      code: 'M1',
      name: 'Mesa 1',
    });
    const product = await get(ProductsService).create({
      restaurantId: restaurant.id,
      code: 'LOMO',
      name: 'Lomo saltado',
      price: 40,
    });
    return { restaurant, table, product };
  }

  async function serviceType(restaurantId: string, mode: FulfillmentMode) {
    const types = await get(ServiceTypesService).list(restaurantId);
    return types.find((type) => type.fulfillmentMode === mode)!;
  }

  async function orderOneDish(attentionId: string, productId: string) {
    const { order, items } = await get(OrdersService).submitOrder({
      attentionId,
      requestId: randomUUID(),
      source: OrderSource.WAITER,
      items: [{ productId, quantity: 1 }],
    });
    return { order, item: items[0] };
  }

  it('seeds every new restaurant with its catalogs, idempotently', async () => {
    const { restaurant } = await createRestaurant('Seeds');
    const statuses = get(WorkflowStatusesService);
    await statuses.seedDefaults(restaurant.id);
    await get(ServiceTypesService).seedDefaults(restaurant.id);

    expect(
      await statuses.list(WorkflowKind.ATTENTION, restaurant.id),
    ).toHaveLength(4);
    expect(await statuses.list(WorkflowKind.ORDER, restaurant.id)).toHaveLength(
      7,
    );
    const types = await get(ServiceTypesService).list(restaurant.id);
    expect(types.map((type) => [type.fulfillmentMode, type.isActive])).toEqual([
      [FulfillmentMode.DINE_IN, true],
      [FulfillmentMode.PICKUP, false],
      [FulfillmentMode.DELIVERY, false],
    ]);
  });

  it('1. lets two restaurants name and order their statuses differently', async () => {
    const first = await createRestaurant('Uno');
    const second = await createRestaurant('Dos');
    const statuses = get(WorkflowStatusesService);
    const [firstPreparing] = (
      await statuses.list(WorkflowKind.ORDER, first.restaurant.id)
    ).filter((status) => status.canonicalState === OrderStatus.IN_PREPARATION);
    await statuses.update(WorkflowKind.ORDER, firstPreparing.id, {
      name: 'En cocina',
      sortOrder: 5,
    });

    const firstNames = (
      await statuses.list(WorkflowKind.ORDER, first.restaurant.id)
    ).map((status) => status.name);
    const secondNames = (
      await statuses.list(WorkflowKind.ORDER, second.restaurant.id)
    ).map((status) => status.name);
    expect(firstNames[0]).toBe('En cocina');
    expect(secondNames[0]).toBe('Enviado');
    expect(secondNames).toContain('En preparación');
  });

  it('2. rejects a status that belongs to another restaurant', async () => {
    const mine = await createRestaurant('Mía');
    const other = await createRestaurant('Otra');
    const attention = await get(AttentionsService).open({
      fulfillmentMode: FulfillmentMode.DINE_IN,
      diningTableId: mine.table.id,
    });
    const { item } = await orderOneDish(attention.id, mine.product.id);
    const [foreign] = (
      await get(WorkflowStatusesService).list(
        WorkflowKind.ORDER,
        other.restaurant.id,
      )
    ).filter((status) => status.canonicalState === OrderStatus.IN_PREPARATION);

    await expect(
      get(OrderItemsService).changeStatus(item.id, { statusId: foreign.id }),
    ).rejects.toThrow(WorkflowStatusNotFoundError);
  });

  it('3. keeps a single active initial status per catalog and restaurant', async () => {
    const { restaurant } = await createRestaurant('Inicial');
    const statuses = get(WorkflowStatusesService);
    const alternative = await statuses.create(WorkflowKind.ORDER, {
      restaurantId: restaurant.id,
      code: 'RECIBIDO',
      name: 'Recibido',
      canonicalState: OrderStatus.SUBMITTED,
      sortOrder: 1,
      isInitial: true,
    });

    const initials = (
      await statuses.list(WorkflowKind.ORDER, restaurant.id)
    ).filter((status) => status.isInitial);
    expect(initials.map((status) => status.id)).toEqual([alternative.id]);
    await expect(
      database.dataSource.query(
        `UPDATE order_statuses SET is_initial = true WHERE restaurant_id = $1 AND code = 'SUBMITTED'`,
        [restaurant.id],
      ),
    ).rejects.toThrow(/uq_order_statuses_initial/);
    await expect(
      statuses.update(WorkflowKind.ORDER, alternative.id, { isActive: false }),
    ).rejects.toThrow(RequiredWorkflowStatusError);
  });

  it('4. deactivates a used status without breaking the records that use it', async () => {
    const { restaurant, table, product } = await createRestaurant('Horno');
    const statuses = get(WorkflowStatusesService);
    const oven = await statuses.create(WorkflowKind.ORDER, {
      restaurantId: restaurant.id,
      code: 'EN_HORNO',
      name: 'En horno',
      canonicalState: OrderStatus.IN_PREPARATION,
      sortOrder: 35,
    });
    const attention = await get(AttentionsService).open({
      fulfillmentMode: FulfillmentMode.DINE_IN,
      diningTableId: table.id,
    });
    const { item } = await orderOneDish(attention.id, product.id);
    await get(OrderItemsService).changeStatus(item.id, { statusId: oven.id });

    await statuses.update(WorkflowKind.ORDER, oven.id, { isActive: false });

    const reloaded = await get(OrderItemsService).findOne(item.id);
    expect(reloaded.statusId).toBe(oven.id);
    expect(reloaded.currentStatus).toBe(OrderStatus.IN_PREPARATION);
    const history = await get(OrderItemsService).history(item.id);
    expect(history.at(-1)?.newStatus).toEqual({
      id: oven.id,
      canonicalState: OrderStatus.IN_PREPARATION,
    });
    // It can't be chosen anymore, and the last active status of a state stays.
    await expect(
      get(OrderItemsService).changeStatus(item.id, { statusId: oven.id }),
    ).rejects.toThrow(WorkflowStatusNotFoundError);
    const [preparing] = (
      await statuses.list(WorkflowKind.ORDER, restaurant.id)
    ).filter((status) => status.code === 'IN_PREPARATION');
    await expect(
      statuses.update(WorkflowKind.ORDER, preparing.id, { isActive: false }),
    ).rejects.toThrow(RequiredWorkflowStatusError);
  });

  it('5. requires a table for a service type that requires one', async () => {
    const { restaurant } = await createRestaurant('Mesa');
    await expect(
      get(AttentionsService).open({
        fulfillmentMode: FulfillmentMode.DINE_IN,
        restaurantId: restaurant.id,
      }),
    ).rejects.toThrow(InvalidServiceSetupError);
  });

  it('6. requires the delivery data for delivery', async () => {
    const { restaurant } = await createRestaurant('Delivery');
    const delivery = await serviceType(restaurant.id, FulfillmentMode.DELIVERY);
    await get(ServiceTypesService).update(delivery.id, {
      isActive: true,
      deliveryFee: 5,
    });
    const contact = { customerName: 'Ana', customerPhone: '999' };

    await expect(
      get(AttentionsService).open({
        serviceTypeId: delivery.id,
        fulfillment: contact,
      }),
    ).rejects.toThrow(InvalidServiceSetupError);
    const attention = await get(AttentionsService).open({
      serviceTypeId: delivery.id,
      fulfillment: { ...contact, deliveryAddress: 'Av. Larco 123' },
    });
    expect(attention.fulfillmentMode).toBe(FulfillmentMode.DELIVERY);
    expect(
      (await get(AttentionsService).getBill(attention.id)).deliveryFee,
    ).toBe(5);
  });

  it('7. needs neither a table nor an address for pickup', async () => {
    const { restaurant } = await createRestaurant('Recojo');
    const pickup = await serviceType(restaurant.id, FulfillmentMode.PICKUP);
    await get(ServiceTypesService).update(pickup.id, { isActive: true });

    const attention = await get(AttentionsService).open({
      serviceTypeId: pickup.id,
      fulfillment: { customerName: 'Luis', customerPhone: '988' },
    });
    expect(attention.diningTableId).toBeNull();
    expect(attention.serviceTypeId).toBe(pickup.id);
  });

  it('8. never closes the attention when an order is finished', async () => {
    const { table, product } = await createRestaurant('Servido');
    const attention = await get(AttentionsService).open({
      fulfillmentMode: FulfillmentMode.DINE_IN,
      diningTableId: table.id,
    });
    const { order, item } = await orderOneDish(attention.id, product.id);
    for (const status of [
      OrderStatus.IN_PREPARATION,
      OrderStatus.READY,
      OrderStatus.SERVED,
    ]) {
      await get(OrderItemsService).changeStatus(item.id, { status });
    }

    expect((await get(OrdersService).findOrder(order.id)).status).toBe(
      OrderStatus.SERVED,
    );
    const reloaded = await get(AttentionsService).findOne(attention.id);
    expect(reloaded.status).toBe(AttentionStatus.OPEN);
    expect(reloaded.isActive).toBe(true);
  });

  it('9. never collects more than the balance with concurrent payments', async () => {
    const { table, product } = await createRestaurant('Carrera');
    const attention = await get(AttentionsService).open({
      fulfillmentMode: FulfillmentMode.DINE_IN,
      diningTableId: table.id,
    });
    await orderOneDish(attention.id, product.id);
    const pay = () =>
      get(PaymentsService).register({
        attentionId: attention.id,
        requestId: randomUUID(),
        method: PaymentMethod.CASH,
        mode: AllocationMode.FULL,
      });

    const results = await Promise.allSettled([pay(), pay(), pay()]);
    const paid = results.filter((result) => result.status === 'fulfilled');
    expect(paid).toHaveLength(1);
    const balance = await get(PaymentsService).balance(attention.id);
    expect(balance.paid).toBe(40);
    expect(balance.outstanding).toBe(0);
  });

  it('10. lets a pending payment reserve the balance only when its status says so', async () => {
    const { table, product } = await createRestaurant('Reserva');
    const attention = await get(AttentionsService).open({
      fulfillmentMode: FulfillmentMode.DINE_IN,
      diningTableId: table.id,
    });
    await orderOneDish(attention.id, product.id);
    const pending = await get(PaymentsService).register({
      attentionId: attention.id,
      requestId: randomUUID(),
      method: PaymentMethod.CARD,
      mode: AllocationMode.FULL,
      provider: { code: 'test_gateway' },
    });
    expect(pending.payment.status).toBe('PENDING');
    let balance = await get(PaymentsService).balance(attention.id);
    expect([balance.reserved, balance.outstanding]).toEqual([40, 0]);
    await expect(
      get(PaymentsService).register({
        attentionId: attention.id,
        requestId: randomUUID(),
        method: PaymentMethod.CASH,
        mode: AllocationMode.FULL,
      }),
    ).rejects.toThrow(NothingToPayError);

    await database.dataSource.query(
      `UPDATE payment_statuses SET reserves_balance = false WHERE code = 'PENDING'`,
    );
    try {
      balance = await get(PaymentsService).balance(attention.id);
      expect([balance.reserved, balance.outstanding]).toEqual([0, 40]);
    } finally {
      await database.dataSource.query(
        `UPDATE payment_statuses SET reserves_balance = true WHERE code = 'PENDING'`,
      );
    }
  });

  it('11. allocates each payment line to a dish or to the delivery fee, never both', async () => {
    const { restaurant, product } = await createRestaurant('Envío');
    const delivery = await serviceType(restaurant.id, FulfillmentMode.DELIVERY);
    await get(ServiceTypesService).update(delivery.id, {
      isActive: true,
      deliveryFee: 7.5,
    });
    const attention = await get(AttentionsService).open({
      serviceTypeId: delivery.id,
      fulfillment: {
        customerName: 'Ana',
        customerPhone: '999',
        deliveryAddress: 'Calle 1',
      },
    });
    await orderOneDish(attention.id, product.id);
    const { payment } = await get(PaymentsService).register({
      attentionId: attention.id,
      requestId: randomUUID(),
      method: PaymentMethod.CASH,
      mode: AllocationMode.FULL,
    });

    const detail = await get(AttentionsService).getDetail(attention.id);
    const fee = payment.allocations.find(
      (allocation) => allocation.concept === AllocationConcept.DELIVERY_FEE,
    );
    expect(payment.amount).toBe(47.5);
    expect(fee).toMatchObject({ amount: 7.5, orderItemId: null });
    expect(fee?.fulfillmentId).toBe(detail.fulfillment?.id);

    const insert = (orderItemId: string | null, fulfillmentId: string | null) =>
      database.dataSource.query(
        `INSERT INTO payment_allocations (payment_id, concept, order_item_id, fulfillment_id, allocated_amount)
         VALUES ($1, 'DELIVERY_FEE', $2, $3, 1)`,
        [payment.id, orderItemId, fulfillmentId],
      );
    await expect(
      insert(detail.items[0].id, detail.fulfillment!.id),
    ).rejects.toThrow(/chk_allocations_target/);
    await expect(insert(null, null)).rejects.toThrow(/chk_allocations_target/);
  });
});
