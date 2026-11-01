import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import {
  ACCESS_POLICY,
  type AccessPolicy,
} from '../../src/common/infrastructure/http/access/authorize.decorator.js';
import { ScopeResolverRegistry } from '../../src/common/infrastructure/http/access/scope-resolver.registry.js';
import { configureHttpApp } from '../../src/common/infrastructure/http/configure-http-app.js';
import { PLATFORM_ADMIN_ROUTE } from '../../src/common/infrastructure/http/platform-admin.decorator.js';
import { IS_PUBLIC_ROUTE } from '../../src/common/infrastructure/http/public.decorator.js';
import { MembershipsService } from '../../src/iam/application/memberships/memberships.service.js';
import { RolesService } from '../../src/iam/application/roles/roles.service.js';
import { UsersService } from '../../src/iam/application/users/users.service.js';
import { RestaurantsService } from '../../src/organizations/application/restaurants/restaurants.service.js';
import {
  createTestDatabase,
  type TestDatabase,
} from '../support/test-database.js';

interface Owner {
  token: string;
  organizationId: string;
  restaurantId: string;
}

// The whole HTTP stack (AuthGuard, PlatformAdminGuard, AuthorizationGuard and
// the error filter) on a throwaway database built by the migrations.
describe('Authorization by membership, role and restaurant scope', () => {
  let database: TestDatabase;
  let app: INestApplication<App>;
  let previousDatabase: string | undefined;
  let ownerA: Owner;
  let ownerB: Owner;

  const http = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function registerOwner(name: string): Promise<Owner> {
    const response = await http()
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
      organizationId: body.organization.id,
      restaurantId: body.restaurant.id,
    };
  }

  async function createProduct(
    owner: Owner,
    restaurantId = owner.restaurantId,
  ) {
    const response = await http()
      .post('/products')
      .set(as(owner.token))
      .send({
        restaurantId,
        code: `P-${randomUUID().slice(0, 8)}`,
        name: 'Lomo saltado',
        price: 40,
      })
      .expect(201);
    return response.body.data.id as string;
  }

  /** A staff user with a base role, logged in. */
  async function staff(
    owner: Owner,
    roleCode: string,
    scope: { allRestaurants?: boolean; restaurantIds?: string[] },
  ): Promise<string> {
    const email = `${roleCode.toLowerCase()}-${randomUUID()}@acmr.pe`;
    const user = await app.get(UsersService).create({
      email,
      password: 'S3cret-password',
      firstName: roleCode,
    });
    const roles = await app
      .get(RolesService)
      .findPage(
        { organizationId: owner.organizationId },
        { page: 1, limit: 50 },
      );
    const role = roles.items.find((candidate) => candidate.code === roleCode);
    await app.get(MembershipsService).create({
      organizationId: owner.organizationId,
      userId: user.id,
      roleId: role!.id,
      ...scope,
    });
    const login = await http()
      .post('/api/v1/owner/auth/login')
      .send({ email, password: 'S3cret-password' })
      .expect(200);
    return login.body.data.accessToken;
  }

  beforeAll(async () => {
    database = await createTestDatabase('restaurant_api_access');
    previousDatabase = process.env.DB_DATABASE;
    process.env.DB_DATABASE = database.name;
    // Imported only now: ConfigModule.forRoot reads the environment when the
    // module is first loaded.
    const { AppModule } = await import('../../src/app.module.js');
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
      providers: [DiscoveryService, MetadataScanner],
    }).compile();
    app = moduleRef.createNestApplication({ logger: ['error'] });
    configureHttpApp(app);
    await app.init();
    ownerA = await registerOwner('ana');
    ownerB = await registerOwner('beto');
  });

  afterAll(async () => {
    await app?.close();
    process.env.DB_DATABASE = previousDatabase;
    await database?.drop();
  });

  it('gives every new organization its base roles', async () => {
    const roles = await app
      .get(RolesService)
      .findPage(
        { organizationId: ownerA.organizationId },
        { page: 1, limit: 50 },
      );
    expect(roles.items.map((role) => role.code).sort()).toEqual([
      'ADMIN',
      'CASHIER',
      'KITCHEN',
      'OWNER',
      'WAITER',
    ]);
  });

  it('lets the owner manage their own catalog', async () => {
    const productId = await createProduct(ownerA);
    await http()
      .patch(`/products/${productId}`)
      .set(as(ownerA.token))
      .send({ name: 'Lomo saltado clásico' })
      .expect(200);
    await http()
      .get('/products')
      .query({ restaurantId: ownerA.restaurantId })
      .set(as(ownerA.token))
      .expect(200);
  });

  it("never lets an organization read or change another one's data", async () => {
    const productId = await createProduct(ownerA);

    const read = await http()
      .get(`/products/${productId}`)
      .set(as(ownerB.token))
      .expect(403);
    expect(read.body.errorCode).toBe('ACCESS_DENIED');
    await http()
      .patch(`/products/${productId}`)
      .set(as(ownerB.token))
      .send({ name: 'Hackeado' })
      .expect(403);
    await http()
      .get('/products')
      .query({ restaurantId: ownerA.restaurantId })
      .set(as(ownerB.token))
      .expect(403);
    await http()
      .post('/products')
      .set(as(ownerB.token))
      .send({
        restaurantId: ownerA.restaurantId,
        code: 'X',
        name: 'X',
        price: 1,
      })
      .expect(403);
  });

  it('requires a tenant to list', async () => {
    const response = await http()
      .get('/products')
      .set(as(ownerA.token))
      .expect(400);
    expect(response.body.errorCode).toBe('TENANT_SCOPE_REQUIRED');
  });

  it('lets a waiter read the catalog but not change it', async () => {
    const waiter = await staff(ownerA, 'WAITER', { allRestaurants: true });
    const productId = await createProduct(ownerA);

    await http().get(`/products/${productId}`).set(as(waiter)).expect(200);
    const change = await http()
      .patch(`/products/${productId}`)
      .set(as(waiter))
      .send({ name: 'Otro nombre' })
      .expect(403);
    expect(change.body.message).toContain('catalog.manage');
  });

  it('limits a membership to its restaurants', async () => {
    const second = await app.get(RestaurantsService).create({
      organizationId: ownerA.organizationId,
      name: 'Sede Norte',
    });
    const admin = await staff(ownerA, 'ADMIN', {
      restaurantIds: [ownerA.restaurantId],
    });
    const there = await createProduct(ownerA, second.id);
    const here = await createProduct(ownerA);

    await http().get(`/products/${here}`).set(as(admin)).expect(200);
    await http().get(`/products/${there}`).set(as(admin)).expect(403);
    await http()
      .post('/products')
      .set(as(admin))
      .send({ restaurantId: second.id, code: 'N1', name: 'Norte', price: 1 })
      .expect(403);
  });

  it('answers 404 for a resource that does not exist', async () => {
    await http()
      .get(`/products/${randomUUID()}`)
      .set(as(ownerA.token))
      .expect(404);
  });

  it('requires the .read permission for payments, finance and staff', async () => {
    const waiter = await staff(ownerA, 'WAITER', { allRestaurants: true });
    const cashier = await staff(ownerA, 'CASHIER', { allRestaurants: true });
    const restaurant = { restaurantId: ownerA.restaurantId };
    const organization = { organizationId: ownerA.organizationId };

    await http()
      .get('/payments')
      .query(restaurant)
      .set(as(cashier))
      .expect(200);
    await http().get('/payments').query(restaurant).set(as(waiter)).expect(403);
    await http()
      .get('/expense-categories')
      .query(organization)
      .set(as(ownerA.token))
      .expect(200);
    await http()
      .get('/expense-categories')
      .query(organization)
      .set(as(cashier))
      .expect(403);
    await http().get('/roles').query(organization).set(as(waiter)).expect(403);
    // Operational reads only need the membership.
    await http()
      .get('/dining-tables')
      .query(restaurant)
      .set(as(waiter))
      .expect(200);
  });

  it('lists only the organizations of the user and leaves creating them to ACMR', async () => {
    const list = await http()
      .get('/organizations')
      .set(as(ownerA.token))
      .expect(200);
    expect(list.body.data.items.map((item: { id: string }) => item.id)).toEqual(
      [ownerA.organizationId],
    );

    await http()
      .post('/organizations')
      .set(as(ownerA.token))
      .send({ name: 'Org paralela' })
      .expect(403);
  });

  it('declares who may call every route, with known resource scopes', () => {
    const reflector = app.get(Reflector);
    const registry = app.get(ScopeResolverRegistry);
    const scanner = app.get(MetadataScanner);
    const builtIn = ['organization', 'restaurant'];
    const problems: string[] = [];
    for (const wrapper of app.get(DiscoveryService).getControllers()) {
      const controller = wrapper.metatype as
        (new (...args: never[]) => object) | null;
      if (!controller) {
        continue;
      }
      for (const name of scanner.getAllMethodNames(controller.prototype)) {
        const handler = (controller.prototype as Record<string, unknown>)[
          name
        ] as (...args: unknown[]) => unknown;
        if (Reflect.getMetadata('method', handler) === undefined) {
          continue;
        }
        const targets = [handler, controller];
        const policy = reflector.getAllAndOverride<AccessPolicy>(
          ACCESS_POLICY,
          targets,
        );
        const open =
          reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE, targets) ||
          reflector.getAllAndOverride<boolean>(PLATFORM_ADMIN_ROUTE, targets);
        if (!open && !policy) {
          problems.push(`${controller.name}.${name}: no access policy`);
        }
        if (policy?.type === 'tenant') {
          for (const scope of policy.scopes) {
            if (
              scope.kind === 'resource' &&
              !builtIn.includes(scope.resource) &&
              !registry.has(scope.resource)
            ) {
              problems.push(
                `${controller.name}.${name}: no scope resolver for "${scope.resource}"`,
              );
            }
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
