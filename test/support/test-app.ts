import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { configureHttpApp } from '../../src/common/infrastructure/http/configure-http-app.js';
import { createTestDatabase, type TestDatabase } from './test-database.js';

export interface Owner {
  token: string;
  userId: string;
  organizationId: string;
  restaurantId: string;
}

export interface TestApp {
  app: INestApplication<App>;
  http: () => ReturnType<typeof request>;
  close(): Promise<void>;
}

export const as = (token: string) => ({ Authorization: `Bearer ${token}` });

/**
 * The whole application (guards, pipes, error filter) on a throwaway
 * database built by the migrations.
 */
export async function createTestApp(
  prefix: string,
  configure: (builder: TestingModuleBuilder) => TestingModuleBuilder = (
    builder,
  ) => builder,
): Promise<TestApp> {
  const database: TestDatabase = await createTestDatabase(prefix);
  const previousDatabase = process.env.DB_DATABASE;
  process.env.DB_DATABASE = database.name;
  // Imported only now: ConfigModule.forRoot reads the environment when the
  // module is first loaded.
  const { AppModule } = await import('../../src/app.module.js');
  const moduleRef = await configure(
    Test.createTestingModule({ imports: [AppModule] }),
  ).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>({
    logger: ['error'],
  });
  configureHttpApp(app);
  await app.init();
  return {
    app,
    http: () => request(app.getHttpServer()),
    async close() {
      await app.close();
      process.env.DB_DATABASE = previousDatabase;
      await database.drop();
    },
  };
}

/** Owner registration: user + organization + first restaurant, logged in. */
export async function registerOwner(
  testApp: TestApp,
  name: string,
): Promise<Owner> {
  const response = await testApp
    .http()
    .post('/api/v1/owner/auth/register')
    .send({
      email: `${name}-${randomUUID()}@acmr.pe`,
      password: 'S3cret-password',
      firstName: name,
      organization: { name: `Org ${name}` },
      restaurant: { name: `Sede ${name}` },
    })
    .expect(201);
  const body = response.body.data;
  return {
    token: body.accessToken,
    userId: body.user.id,
    organizationId: body.organization.id,
    restaurantId: body.restaurant.id,
  };
}

/** An active product of the owner's restaurant. */
export async function createProduct(
  testApp: TestApp,
  owner: Owner,
  body: Record<string, unknown> = {},
): Promise<string> {
  const response = await testApp
    .http()
    .post('/products')
    .set(as(owner.token))
    .send({
      restaurantId: owner.restaurantId,
      code: `P-${randomUUID().slice(0, 8)}`,
      name: 'Lomo saltado',
      price: 40,
      ...body,
    })
    .expect(201);
  return response.body.data.id as string;
}

/** A table on a new floor of the owner's restaurant, with an active QR. */
export async function createTableWithQr(
  testApp: TestApp,
  owner: Owner,
): Promise<{ tableId: string; floorId: string; qrToken: string }> {
  const floor = await testApp
    .http()
    .post('/restaurant-floors')
    .set(as(owner.token))
    .send({
      restaurantId: owner.restaurantId,
      name: `Piso ${randomUUID().slice(0, 6)}`,
    })
    .expect(201);
  const table = await testApp
    .http()
    .post('/dining-tables')
    .set(as(owner.token))
    .send({
      floorId: floor.body.data.id,
      code: `M-${randomUUID().slice(0, 6)}`,
      name: 'Mesa',
      capacity: 4,
    })
    .expect(201);
  const qr = await testApp
    .http()
    .post(`/dining-tables/${table.body.data.id}/qr-code`)
    .set(as(owner.token))
    .send({})
    .expect(201);
  return {
    tableId: table.body.data.id,
    floorId: floor.body.data.id,
    qrToken: qr.body.data.token,
  };
}

/** A diner account, logged in. */
export async function registerCustomer(
  testApp: TestApp,
  name: string,
): Promise<{ token: string; userId: string; email: string }> {
  const email = `${name}-${randomUUID()}@correo.pe`;
  const response = await testApp
    .http()
    .post('/api/v1/customer/auth/register')
    .send({ email, password: 'S3cret-password', firstName: name })
    .expect(201);
  return {
    token: response.body.data.accessToken,
    userId: response.body.data.user.id,
    email,
  };
}
