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

describe('Payments: manual status follow-up', () => {
  let testApp: TestApp;
  let owner: Owner;

  const http = () => testApp.http();

  /** An active attention owing 30 at a new table. */
  async function openAttention(): Promise<string> {
    const productId = await createProduct(testApp, owner, { price: 30 });
    const { qrToken } = await createTableWithQr(testApp, owner);
    const response = await http()
      .post('/api/v1/attentions')
      .send({
        tableToken: qrToken,
        requestId: randomUUID(),
        items: [{ productId, quantity: 1 }],
      })
      .expect(201);
    return response.body.data.id;
  }

  /** A POS payment of the whole bill, waiting for the voucher. */
  async function pendingPayment(attentionId: string): Promise<string> {
    const response = await http()
      .post('/payments')
      .set(as(owner.token))
      .send({
        attentionId,
        requestId: randomUUID(),
        method: 'CARD',
        mode: 'FULL',
        provider: { code: 'pos' },
      })
      .expect(201);
    expect(response.body.data.status).toBe('PENDING');
    return response.body.data.id;
  }

  const changeStatus = (id: string, status: string) =>
    http()
      .patch(`/payments/${id}/status`)
      .set(as(owner.token))
      .send({ status });

  beforeAll(async () => {
    testApp = await createTestApp('restaurant_api_payments');
    owner = await registerOwner(testApp, 'raquel');
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it('confirms a pending payment and the attention can close', async () => {
    const attentionId = await openAttention();
    const paymentId = await pendingPayment(attentionId);

    await changeStatus(paymentId, 'PROCESSING').expect(200);
    const paid = await changeStatus(paymentId, 'PAID').expect(200);
    expect(paid.body.data.status).toBe('PAID');
    expect(paid.body.data.paidAt).toEqual(expect.any(String));
    // Repeating it is harmless.
    await changeStatus(paymentId, 'PAID').expect(200);

    const bill = await http()
      .get(`/attentions/${attentionId}/bill`)
      .set(as(owner.token))
      .expect(200);
    expect(bill.body.data.balance).toBe(0);
    await http()
      .post(`/attentions/${attentionId}/close`)
      .set(as(owner.token))
      .expect(200);
  });

  it('marks a declined voucher as failed and frees the balance', async () => {
    const attentionId = await openAttention();
    const paymentId = await pendingPayment(attentionId);
    await changeStatus(paymentId, 'FAILED').expect(200);

    const balance = await http()
      .get(`/payments/balance/${attentionId}`)
      .set(as(owner.token))
      .expect(200);
    expect(balance.body.data.outstanding).toBe(30);
    // A failed payment is final.
    const reopened = await changeStatus(paymentId, 'PAID').expect(409);
    expect(reopened.body.errorCode).toBe('INVALID_PAYMENT_TRANSITION');
  });

  it('does not refund yet', async () => {
    const attentionId = await openAttention();
    const paymentId = await pendingPayment(attentionId);
    await changeStatus(paymentId, 'PAID').expect(200);
    const refund = await changeStatus(paymentId, 'REFUNDED').expect(422);
    expect(refund.body.errorCode).toBe('REFUNDS_NOT_ENABLED');
  });

  it("can't touch another organization's payment", async () => {
    const attentionId = await openAttention();
    const paymentId = await pendingPayment(attentionId);
    const other = await registerOwner(testApp, 'samuel');
    await http()
      .patch(`/payments/${paymentId}/status`)
      .set(as(other.token))
      .send({ status: 'PAID' })
      .expect(403);
  });
});
