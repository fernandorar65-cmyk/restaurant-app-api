import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { NestFactory } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from '../dist/app.module.js';
import { configureHttpApp } from '../dist/common/infrastructure/http/configure-http-app.js';

// Additive: each run creates a separate demo tenant and preserves existing data.
if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '::1'].includes(process.env.DB_HOST ?? 'localhost')) {
  throw new Error('El seed solo admite una base local fuera de producción');
}
const run = Date.now().toString();
const password = 'Demo2026!Restaurante';
const manifest = { run, database: process.env.DB_DATABASE, password, ownerEmail: `owner.demo.${run}@example.com`, customerEmail: `cliente.demo.${run}@example.com`, records: {} };
await mkdir('.tmp', { recursive: true });
const output = `.tmp/demo-${run}.json`;
async function save() { await writeFile(output, JSON.stringify(manifest, null, 2), { mode: 0o600 }); }
await save();
const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
configureHttpApp(app);
let token;
async function api(method, path, body, auth = token) {
  let req = request(app.getHttpServer())[method](path);
  if (auth) req = req.set('Authorization', `Bearer ${auth}`);
  if (body) req = req.send(body);
  const response = await req;
  if (response.status >= 400) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(response.body)}`);
  return response.body.data;
}
async function remember(key, value) { manifest.records[key] = value; await save(); return value; }
try {
  await app.init();
  const session = await api('post', '/api/v1/owner/auth/register', {
    email: manifest.ownerEmail, password, firstName: 'Fernando Demo',
    organization: { name: `Sabores del Perú Demo ${run}` }, restaurant: { name: 'Sede Miraflores Demo' },
  });
  token = session.accessToken;
  const organizationId = session.organization.id;
  const restaurantId = session.restaurant.id;
  await remember('owner', { userId: session.user.id, organizationId, restaurantId });
  const customer = await api('post', '/api/v1/customer/auth/register', { email: manifest.customerEmail, password, firstName: 'Lucía Demo' }, null);
  await remember('customer', { userId: customer.user.id });
  const menu = await remember('menu', await api('post', '/menus', { restaurantId, name: 'Carta de prueba' }));
  const products = [];
  for (const [sectionName, entries] of [
    ['Fondos', [['Lomo saltado', 38], ['Ají de gallina', 28], ['Arroz con pollo', 25]]],
    ['Bebidas', [['Chicha morada', 8], ['Limonada', 7]]],
    ['Postres', [['Suspiro a la limeña', 14], ['Mazamorra morada', 10]]],
  ]) {
    const section = await api('post', `/menus/${menu.id}/sections`, { name: sectionName });
    for (const [name, price] of entries) {
      const product = await api('post', '/products', { restaurantId, code: `DEMO-${products.length + 1}`, name, price, isAvailable: name !== 'Mazamorra morada' });
      products.push(product); await remember('products', products);
      await api('post', `/menus/${menu.id}/products`, { productId: product.id, menuSectionId: section.id, sortOrder: products.length });
    }
  }
  await api('patch', `/menus/${menu.id}`, { status: 'ACTIVE' });
  const tables = [];
  for (const name of ['Salón principal', 'Terraza']) {
    const floor = await api('post', '/restaurant-floors', { restaurantId, name });
    for (let i = 0; i < 3; i++) {
      const table = await api('post', '/dining-tables', { floorId: floor.id, code: `M${tables.length + 1}`, name: `Mesa ${tables.length + 1}`, capacity: 4, positionX: 100 + i * 160, positionY: 100 });
      const qr = await api('post', `/dining-tables/${table.id}/qr-code`, {});
      tables.push({ ...table, qr }); await remember('tables', tables);
    }
  }
  const attentions = [];
  for (let i = 0; i < 5; i++) {
    const attention = await api('post', '/api/v1/attentions', { tableToken: tables[i].qr.token, requestId: randomUUID(), items: [{ productId: products[i % 3].id, quantity: 2 }, { productId: products[3].id, quantity: 2 }] }, customer.accessToken);
    attentions.push({ id: attention.id, scenario: ['Pedido nuevo', 'En preparación', 'Listo para servir', 'Pago pendiente POS', 'Pagado y cerrado'][i] });
    await remember('attentions', attentions);
    if (i === 1 || i === 2) {
      const items = await api('get', `/order-items?restaurantId=${restaurantId}&limit=100`);
      for (const item of items.items.filter(item => item.attentionId === attention.id)) {
        await api('patch', `/order-items/${item.id}/status`, { status: 'IN_PREPARATION' });
        if (i === 2) await api('patch', `/order-items/${item.id}/status`, { status: 'READY' });
      }
    }
    if (i >= 3) {
      const payment = await api('post', '/payments', { attentionId: attention.id, requestId: randomUUID(), method: 'CARD', mode: 'FULL', provider: { code: 'pos' } });
      attentions[i].paymentId = payment.id;
      if (i === 4) {
        await api('patch', `/payments/${payment.id}/status`, { status: 'PAID' });
        await api('post', `/attentions/${attention.id}/close`, {});
      }
      await remember('attentions', attentions);
    }
  }
  const category = await api('post', '/inventory-categories', { organizationId, name: 'Insumos demo' });
  const supplies = [];
  for (const [code, name, quantity, unitCost] of [['ARR', 'Arroz', 30, 4], ['POL', 'Pollo', 20, 12], ['PAP', 'Papa amarilla', 25, 5]]) {
    const supply = await api('post', '/supplies', { organizationId, categoryId: category.id, code, name, unitCode: 'KG' });
    const stock = await api('post', '/restaurant-supplies', { restaurantId, supplyId: supply.id });
    await api('post', `/restaurant-supplies/${stock.id}/movements`, { type: 'PURCHASE', quantity, unitCost });
    await api('post', `/restaurant-supplies/${stock.id}/movements`, { type: 'WASTE', quantity: 1 });
    supplies.push({ supplyId: supply.id, stockId: stock.id }); await remember('supplies', supplies);
  }
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date());
  for (const [name, amount] of [['Servicios básicos', 120], ['Transporte', 35], ['Limpieza', 65]]) {
    const category = await api('post', '/expense-categories', { organizationId, name });
    await api('post', '/expenses', { restaurantId, categoryId: category.id, description: `${name} de prueba`, amount, expenseDate: date });
  }
  const area = await api('post', '/work-areas', { organizationId, name: 'Cocina' });
  const position = await api('post', '/job-positions', { workAreaId: area.id, name: 'Cocinero' });
  await remember('employee', await api('post', '/employees', { organizationId, employeeCode: 'DEMO-COC-01', jobPositionId: position.id, hiredAt: date }));
  const storefront = await api('get', `/api/v1/restaurants/${restaurantId}/menu`, null, null);
  if (storefront.products.length !== products.length) throw new Error('La carta pública no contiene todos los productos');
  manifest.complete = true; await save();
  console.log(`Demo creada y carta pública verificada. Detalles: ${output}`);
  console.log(JSON.stringify({ ownerEmail: manifest.ownerEmail, customerEmail: manifest.customerEmail, password, restaurantId, organizationId }, null, 2));
} finally {
  await app.close();
}
