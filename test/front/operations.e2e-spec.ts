import { randomUUID } from 'node:crypto';
import {
  as,
  createProduct,
  createTableWithQr,
  createTestApp,
  registerOwner,
  type Owner,
  type TestApp,
} from '../support/test-app.js';

interface Item {
  id: string;
  version: number;
  status: string;
}

describe('Operations: floor plan, timeline and bulk status changes', () => {
  let testApp: TestApp;
  let owner: Owner;
  let table: { tableId: string; floorId: string; qrToken: string };
  let attentionId: string;
  let items: Item[];

  const http = () => testApp.http();

  beforeAll(async () => {
    testApp = await createTestApp('restaurant_api_operations');
    owner = await registerOwner(testApp, 'pablo');
    const lomo = await createProduct(testApp, owner, { price: 40 });
    const chicha = await createProduct(testApp, owner, {
      name: 'Chicha morada',
      price: 10,
    });
    table = await createTableWithQr(testApp, owner);
    // A second, free table on the same floor.
    await http()
      .post('/dining-tables')
      .set(as(owner.token))
      .send({
        floorId: table.floorId,
        code: 'LIBRE',
        name: 'Libre',
        capacity: 2,
      })
      .expect(201);

    const opened = await http()
      .post('/api/v1/attentions')
      .send({
        tableToken: table.qrToken,
        requestId: randomUUID(),
        items: [
          { productId: lomo, quantity: 1 },
          { productId: chicha, quantity: 2 },
        ],
      })
      .expect(201);
    attentionId = opened.body.data.id;
    items = opened.body.data.orders[0].items;
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it('draws the floor plan with occupancy and KPIs', async () => {
    const response = await http()
      .get('/floor-plan')
      .query({ restaurantId: owner.restaurantId })
      .set(as(owner.token))
      .expect(200);
    const plan = response.body.data;
    expect(plan.floors.map((floor: { id: string }) => floor.id)).toEqual([
      table.floorId,
    ]);
    const occupied = plan.tables.find(
      (candidate: { id: string }) => candidate.id === table.tableId,
    );
    expect(occupied.occupancy).toBe('OCCUPIED');
    expect(occupied.attention).toMatchObject({
      id: attentionId,
      total: 60,
      balance: 60,
    });
    const free = plan.tables.find(
      (candidate: { code: string }) => candidate.code === 'LIBRE',
    );
    expect(free).toMatchObject({ occupancy: 'AVAILABLE', attention: null });
    expect(plan.kpis).toEqual({
      tables: 2,
      availableTables: 1,
      occupiedTables: 1,
      occupiedSeats: 4,
      activeAttentions: 1,
      billRequested: 0,
      pendingAmount: 60,
    });
  });

  it('changes several items at once and reports the ones that could not change', async () => {
    const [first, second] = items;
    const response = await http()
      .post('/order-items/status')
      .set(as(owner.token))
      .send({
        restaurantId: owner.restaurantId,
        status: 'IN_PREPARATION',
        items: [
          { id: first.id, version: first.version },
          { id: second.id, version: second.version + 5 },
          { id: randomUUID() },
        ],
      })
      .expect(200);
    const { updated, failed } = response.body.data;
    expect(updated.map((item: Item) => [item.id, item.status])).toEqual([
      [first.id, 'IN_PREPARATION'],
    ]);
    expect(failed.map((failure: { id: string }) => failure.id)).toEqual([
      second.id,
      expect.any(String),
    ]);
    expect(failed[1].errorCode).toBe('ORDER_ITEM_NOT_FOUND');
  });

  it("never touches another restaurant's items", async () => {
    const other = await registerOwner(testApp, 'quique');
    const response = await http()
      .post('/order-items/status')
      .set(as(other.token))
      .send({
        restaurantId: other.restaurantId,
        status: 'IN_PREPARATION',
        items: [{ id: items[1].id }],
      })
      .expect(200);
    expect(response.body.data.updated).toEqual([]);
    expect(response.body.data.failed[0].errorCode).toBe('ORDER_ITEM_NOT_FOUND');
    await http()
      .post('/order-items/status')
      .set(as(other.token))
      .send({
        restaurantId: owner.restaurantId,
        status: 'IN_PREPARATION',
        items: [{ id: items[1].id }],
      })
      .expect(403);
  });

  it('tells the story of the attention in order', async () => {
    await http()
      .post(`/attentions/${attentionId}/request-bill`)
      .set(as(owner.token))
      .expect(200);
    const response = await http()
      .get(`/attentions/${attentionId}/timeline`)
      .set(as(owner.token))
      .expect(200);
    const types = response.body.data.map(
      (event: { type: string }) => event.type,
    );
    expect(types[0]).toBe('ATTENTION_OPENED');
    expect(types[1]).toBe('ORDER_SUBMITTED');
    expect(types.at(-1)).toBe('BILL_REQUESTED');
    const preparation = response.body.data.find(
      (event: { toStatus: string }) => event.toStatus === 'IN_PREPARATION',
    );
    expect(preparation).toMatchObject({
      orderItemId: items[0].id,
      fromStatus: 'SUBMITTED',
      userId: owner.userId,
    });
  });
});
