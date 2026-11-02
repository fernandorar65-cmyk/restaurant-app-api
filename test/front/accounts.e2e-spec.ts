import { randomUUID } from 'node:crypto';
import { EmployeesService } from '../../src/organizations/application/employees/employees.service.js';
import {
  as,
  createProduct,
  createTableWithQr,
  createTestApp,
  registerCustomer,
  registerOwner,
  type Owner,
  type TestApp,
} from '../support/test-app.js';

describe('Accounts: diner password, visits and staff profile', () => {
  let testApp: TestApp;
  let owner: Owner;

  const http = () => testApp.http();

  beforeAll(async () => {
    testApp = await createTestApp('restaurant_api_accounts');
    owner = await registerOwner(testApp, 'olga');
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it('lets a diner change their password knowing the current one', async () => {
    const diner = await registerCustomer(testApp, 'diego');
    await http()
      .patch('/api/v1/customer/me/password')
      .set(as(diner.token))
      .send({ currentPassword: 'wrong-password', newPassword: 'N3w-password' })
      .expect(401);
    await http()
      .patch('/api/v1/customer/me/password')
      .set(as(diner.token))
      .send({ currentPassword: 'S3cret-password', newPassword: 'N3w-password' })
      .expect(204);
    await http()
      .post('/api/v1/customer/auth/login')
      .send({ email: diner.email, password: 'N3w-password' })
      .expect(200);
  });

  it("lists the diner's visits with restaurant and totals, and nobody else's", async () => {
    const diner = await registerCustomer(testApp, 'vera');
    const stranger = await registerCustomer(testApp, 'xavi');
    const productId = await createProduct(testApp, owner, { price: 25 });
    const { qrToken } = await createTableWithQr(testApp, owner);
    await http()
      .post('/api/v1/attentions')
      .set(as(diner.token))
      .send({
        tableToken: qrToken,
        requestId: randomUUID(),
        items: [{ productId, quantity: 2 }],
      })
      .expect(201);

    const visits = await http()
      .get('/api/v1/customer/me/attentions')
      .set(as(diner.token))
      .expect(200);
    expect(visits.body.data.meta.total).toBe(1);
    const [visit] = visits.body.data.items;
    expect(visit.restaurant.id).toBe(owner.restaurantId);
    expect(visit.restaurant.name).toBe('Sede olga');
    expect(visit.items).toHaveLength(1);
    expect([visit.total, visit.paid, visit.balance]).toEqual([50, 0, 50]);

    const none = await http()
      .get('/api/v1/customer/me/attentions')
      .set(as(stranger.token))
      .expect(200);
    expect(none.body.data.items).toEqual([]);
    await http().get('/api/v1/customer/me/attentions').expect(401);
  });

  it('returns the staff profile with access and employment', async () => {
    const area = await http()
      .post('/work-areas')
      .set(as(owner.token))
      .send({ organizationId: owner.organizationId, name: 'Administración' })
      .expect(201);
    const position = await http()
      .post('/job-positions')
      .set(as(owner.token))
      .send({ workAreaId: area.body.data.id, name: 'Gerente' })
      .expect(201);
    await testApp.app.get(EmployeesService).create({
      organizationId: owner.organizationId,
      userId: owner.userId,
      employeeCode: 'E-001',
      jobPositionId: position.body.data.id,
    });

    const response = await http()
      .get('/api/v1/owner/me/profile')
      .set(as(owner.token))
      .expect(200);
    const profile = response.body.data;
    expect(profile.user.id).toBe(owner.userId);
    expect(profile.user.passwordHash).toBeUndefined();
    expect(profile.access).toHaveLength(1);
    expect(profile.access[0]).toMatchObject({
      organizationId: owner.organizationId,
      organizationName: 'Org olga',
      role: { code: 'OWNER' },
      allRestaurants: true,
    });
    expect(profile.access[0].permissions).toContain('payments.manage');
    expect(profile.employments).toEqual([
      expect.objectContaining({
        organizationName: 'Org olga',
        employeeCode: 'E-001',
        jobPosition: { id: position.body.data.id, name: 'Gerente' },
        workArea: { id: area.body.data.id, name: 'Administración' },
      }),
    ]);
  });
});
