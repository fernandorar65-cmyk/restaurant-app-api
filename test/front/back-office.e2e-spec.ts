import {
  as,
  createTestApp,
  registerOwner,
  type Owner,
  type TestApp,
} from '../support/test-app.js';

describe('Back office: restaurant stock history and expense categories', () => {
  let testApp: TestApp;
  let owner: Owner;

  const http = () => testApp.http();

  /** A master supply enabled in the owner's restaurant; returns the stock id. */
  async function stockOf(
    code: string,
  ): Promise<{ supplyId: string; stockId: string }> {
    const category = await http()
      .post('/inventory-categories')
      .set(as(owner.token))
      .send({ organizationId: owner.organizationId, name: `Cat ${code}` })
      .expect(201);
    const supply = await http()
      .post('/supplies')
      .set(as(owner.token))
      .send({
        organizationId: owner.organizationId,
        categoryId: category.body.data.id,
        code,
        name: code,
        unitCode: 'KG',
      })
      .expect(201);
    const stock = await http()
      .post('/restaurant-supplies')
      .set(as(owner.token))
      .send({ restaurantId: owner.restaurantId, supplyId: supply.body.data.id })
      .expect(201);
    return { supplyId: supply.body.data.id, stockId: stock.body.data.id };
  }

  beforeAll(async () => {
    testApp = await createTestApp('restaurant_api_back_office');
    owner = await registerOwner(testApp, 'amalia');
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it('lists the movements of every supply of the restaurant, newest first', async () => {
    const rice = await stockOf('ARROZ');
    const oil = await stockOf('ACEITE');
    const move = (stockId: string, type: string, quantity: number) =>
      http()
        .post(`/restaurant-supplies/${stockId}/movements`)
        .set(as(owner.token))
        .send({ type, quantity, unitCost: 4 })
        .expect(201);
    await move(rice.stockId, 'PURCHASE', 10);
    await move(oil.stockId, 'PURCHASE', 5);
    await move(rice.stockId, 'WASTE', 1);

    const all = await http()
      .get('/inventory-movements')
      .query({ restaurantId: owner.restaurantId })
      .set(as(owner.token))
      .expect(200);
    expect(
      all.body.data.items.map(
        (movement: { type: string; restaurantSupplyId: string }) => [
          movement.type,
          movement.restaurantSupplyId,
        ],
      ),
    ).toEqual([
      ['WASTE', rice.stockId],
      ['PURCHASE', oil.stockId],
      ['PURCHASE', rice.stockId],
    ]);

    const riceOnly = await http()
      .get('/inventory-movements')
      .query({
        restaurantId: owner.restaurantId,
        supplyId: rice.supplyId,
        type: 'PURCHASE',
      })
      .set(as(owner.token))
      .expect(200);
    expect(riceOnly.body.data.meta.total).toBe(1);

    const future = await http()
      .get('/inventory-movements')
      .query({ restaurantId: owner.restaurantId, from: '2999-01-01' })
      .set(as(owner.token))
      .expect(200);
    expect(future.body.data.items).toEqual([]);

    const other = await registerOwner(testApp, 'bruno');
    await http()
      .get('/inventory-movements')
      .query({ restaurantId: owner.restaurantId })
      .set(as(other.token))
      .expect(403);
  });

  it('retires an expense category moving its expenses to another one', async () => {
    const create = async (name: string) =>
      (
        await http()
          .post('/expense-categories')
          .set(as(owner.token))
          .send({ organizationId: owner.organizationId, name })
          .expect(201)
      ).body.data.id as string;
    const old = await create('Servicios');
    const target = await create('Servicios básicos');
    for (const amount of [100, 50]) {
      await http()
        .post('/expenses')
        .set(as(owner.token))
        .send({
          restaurantId: owner.restaurantId,
          categoryId: old,
          description: 'Luz',
          amount,
          expenseDate: '2026-10-15',
        })
        .expect(201);
    }

    await http()
      .delete(`/expense-categories/${old}`)
      .query({ moveTo: old })
      .set(as(owner.token))
      .expect(400);

    const response = await http()
      .delete(`/expense-categories/${old}`)
      .query({ moveTo: target })
      .set(as(owner.token))
      .expect(200);
    expect(response.body.data).toEqual({ id: old, movedExpenses: 2 });

    const moved = await http()
      .get('/expenses')
      .query({ restaurantId: owner.restaurantId, categoryId: target })
      .set(as(owner.token))
      .expect(200);
    expect(moved.body.data.meta.total).toBe(2);
    const retired = await http()
      .get(`/expense-categories/${old}`)
      .set(as(owner.token))
      .expect(200);
    expect(retired.body.data.isActive).toBe(false);
  });

  it('never moves expenses into another organization', async () => {
    const other = await registerOwner(testApp, 'carla');
    const mine = await http()
      .post('/expense-categories')
      .set(as(owner.token))
      .send({ organizationId: owner.organizationId, name: 'Propia' })
      .expect(201);
    const theirs = await http()
      .post('/expense-categories')
      .set(as(other.token))
      .send({ organizationId: other.organizationId, name: 'Ajena' })
      .expect(201);
    const response = await http()
      .delete(`/expense-categories/${mine.body.data.id}`)
      .query({ moveTo: theirs.body.data.id })
      .set(as(owner.token))
      .expect(400);
    expect(response.body.errorCode).toBe('INVALID_EXPENSE_CATEGORY_MOVE');
  });
});
