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

const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Lima',
}).format(new Date());

describe('Reports: daily financials and metrics', () => {
  let testApp: TestApp;
  let owner: Owner;
  let lomo: string;

  const http = () => testApp.http();

  beforeAll(async () => {
    testApp = await createTestApp('restaurant_api_reports');
    owner = await registerOwner(testApp, 'diana');
    lomo = await createProduct(testApp, owner, {
      name: 'Lomo saltado',
      price: 40,
    });
    const chicha = await createProduct(testApp, owner, {
      name: 'Chicha',
      price: 10,
    });

    // A table orders 2 lomos and 1 chicha, the kitchen serves them, it pays cash and closes.
    const { qrToken } = await createTableWithQr(testApp, owner);
    const opened = await http()
      .post('/api/v1/attentions')
      .send({
        tableToken: qrToken,
        requestId: randomUUID(),
        items: [
          { productId: lomo, quantity: 2 },
          { productId: chicha, quantity: 1 },
        ],
      })
      .expect(201);
    const attentionId = opened.body.data.id;
    const items = opened.body.data.orders[0].items.map(
      (item: { id: string }) => ({
        id: item.id,
      }),
    );
    for (const status of ['IN_PREPARATION', 'READY', 'SERVED']) {
      await http()
        .post('/order-items/status')
        .set(as(owner.token))
        .send({ restaurantId: owner.restaurantId, status, items })
        .expect(200);
    }
    await http()
      .post('/payments')
      .set(as(owner.token))
      .send({
        attentionId,
        requestId: randomUUID(),
        method: 'CASH',
        mode: 'FULL',
      })
      .expect(201);
    await http()
      .post(`/attentions/${attentionId}/close`)
      .set(as(owner.token))
      .expect(200);

    const category = await http()
      .post('/expense-categories')
      .set(as(owner.token))
      .send({ organizationId: owner.organizationId, name: 'Insumos' })
      .expect(201);
    await http()
      .post('/expenses')
      .set(as(owner.token))
      .send({
        restaurantId: owner.restaurantId,
        categoryId: category.body.data.id,
        description: 'Verduras',
        amount: 30,
        expenseDate: today,
        paymentMethod: 'CASH',
      })
      .expect(201);
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it('gives one entry per day that matches the closure preview', async () => {
    const response = await http()
      .get('/reports/daily-financials')
      .query({ restaurantId: owner.restaurantId, from: today, to: today })
      .set(as(owner.token))
      .expect(200);
    const [day] = response.body.data.days;
    expect(day).toMatchObject({
      businessDate: today,
      closedAttentions: 1,
      grossSales: 90,
      netSales: 90,
      expenseAmount: 30,
      profit: 60,
      averageTicket: 90,
      byMethod: [{ method: 'CASH', amount: 90 }],
    });
    expect(response.body.data.totals.netSales).toBe(90);

    const preview = await http()
      .get('/daily-closures/preview')
      .query({ restaurantId: owner.restaurantId, businessDate: today })
      .set(as(owner.token))
      .expect(200);
    expect(preview.body.data).toMatchObject({
      openedAttentions: day.openedAttentions,
      closedAttentions: day.closedAttentions,
      grossSales: day.grossSales,
      netSales: day.netSales,
      expenseAmount: day.expenseAmount,
    });
  });

  it('fills the days without activity with zeros', async () => {
    const response = await http()
      .get('/reports/daily-financials')
      .query({
        restaurantId: owner.restaurantId,
        from: '2026-01-01',
        to: '2026-01-03',
      })
      .set(as(owner.token))
      .expect(200);
    expect(response.body.data.days).toHaveLength(3);
    expect(response.body.data.totals.netSales).toBe(0);
  });

  it('ranks products and measures the kitchen stages', async () => {
    const response = await http()
      .get('/reports/metrics')
      .query({ restaurantId: owner.restaurantId, from: today, to: today })
      .set(as(owner.token))
      .expect(200);
    const { totals, topProducts, stageTimes } = response.body.data;
    expect(totals.closedAttentions).toBe(1);
    expect(topProducts[0]).toMatchObject({
      productId: lomo,
      productName: 'Lomo saltado',
      quantity: 2,
      revenue: 80,
    });
    expect(topProducts).toHaveLength(2);
    expect(
      stageTimes.map((stage: { from: string; to: string; items: number }) => [
        stage.from,
        stage.to,
        stage.items,
      ]),
    ).toEqual([
      ['SUBMITTED', 'IN_PREPARATION', 2],
      ['IN_PREPARATION', 'READY', 2],
      ['READY', 'SERVED', 2],
      ['SUBMITTED', 'SERVED', 2],
    ]);
    for (const stage of stageTimes) {
      expect(stage.averageMinutes).toBeGreaterThanOrEqual(0);
    }
  });

  it('validates the period and the access', async () => {
    const inverted = await http()
      .get('/reports/metrics')
      .query({
        restaurantId: owner.restaurantId,
        from: '2026-02-01',
        to: '2026-01-01',
      })
      .set(as(owner.token))
      .expect(400);
    expect(inverted.body.errorCode).toBe('VALIDATION');
    const other = await registerOwner(testApp, 'emilio');
    await http()
      .get('/reports/daily-financials')
      .query({ restaurantId: owner.restaurantId, from: today, to: today })
      .set(as(other.token))
      .expect(403);
  });
});
