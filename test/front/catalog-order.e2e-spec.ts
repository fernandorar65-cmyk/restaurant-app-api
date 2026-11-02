import {
  as,
  createProduct,
  createTestApp,
  registerOwner,
  type Owner,
  type TestApp,
} from '../support/test-app.js';

describe('Catalog: reorder sections and products in one request', () => {
  let testApp: TestApp;
  let owner: Owner;
  let menuId: string;
  let sections: Record<string, string>;
  let products: Record<string, string>;

  const http = () => testApp.http();

  beforeAll(async () => {
    testApp = await createTestApp('restaurant_api_catalog_order');
    owner = await registerOwner(testApp, 'ursula');
    const menu = await http()
      .post('/menus')
      .set(as(owner.token))
      .send({ restaurantId: owner.restaurantId, name: 'Carta' })
      .expect(201);
    menuId = menu.body.data.id;
    sections = {};
    for (const [index, name] of ['Entradas', 'Fondos', 'Postres'].entries()) {
      const section = await http()
        .post(`/menus/${menuId}/sections`)
        .set(as(owner.token))
        .send({ name, sortOrder: index })
        .expect(201);
      sections[name] = section.body.data.id;
    }
    products = {};
    for (const [index, name] of ['Lomo', 'Ají', 'Seco'].entries()) {
      products[name] = await createProduct(testApp, owner, { name });
      await http()
        .post(`/menus/${menuId}/products`)
        .set(as(owner.token))
        .send({
          productId: products[name],
          menuSectionId: sections.Fondos,
          sortOrder: index,
        })
        .expect(201);
    }
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it('reorders all the sections of a menu', async () => {
    const response = await http()
      .put(`/menus/${menuId}/sections/order`)
      .set(as(owner.token))
      .send({ ids: [sections.Postres, sections.Entradas, sections.Fondos] })
      .expect(200);
    expect(
      response.body.data.map((section: { name: string; sortOrder: number }) => [
        section.name,
        section.sortOrder,
      ]),
    ).toEqual([
      ['Postres', 0],
      ['Entradas', 1],
      ['Fondos', 2],
    ]);
  });

  it('rejects an incomplete or foreign list without changing anything', async () => {
    const missing = await http()
      .put(`/menus/${menuId}/sections/order`)
      .set(as(owner.token))
      .send({ ids: [sections.Entradas, sections.Fondos] })
      .expect(400);
    expect(missing.body.errorCode).toBe('INVALID_REORDER');
    const list = await http()
      .get(`/menus/${menuId}/sections`)
      .set(as(owner.token))
      .expect(200);
    expect(
      list.body.data.map((section: { name: string }) => section.name),
    ).toEqual(['Postres', 'Entradas', 'Fondos']);
  });

  it('reorders the products of a section', async () => {
    const response = await http()
      .put(`/menus/${menuId}/products/order`)
      .set(as(owner.token))
      .send({
        menuSectionId: sections.Fondos,
        productIds: [products.Seco, products.Lomo, products['Ají']],
      })
      .expect(200);
    expect(
      response.body.data.map((entry: { productId: string }) => entry.productId),
    ).toEqual([products.Seco, products.Lomo, products['Ají']]);
    // Products without a section are another list: Fondos' are not in it.
    await http()
      .put(`/menus/${menuId}/products/order`)
      .set(as(owner.token))
      .send({ productIds: [products.Seco] })
      .expect(400);
  });

  it('only lets the owner of the menu reorder it', async () => {
    const other = await registerOwner(testApp, 'victor');
    await http()
      .put(`/menus/${menuId}/sections/order`)
      .set(as(other.token))
      .send({ ids: [sections.Postres, sections.Entradas, sections.Fondos] })
      .expect(403);
  });
});
