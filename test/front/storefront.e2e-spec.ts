import {
  as,
  createProduct,
  createTestApp,
  registerOwner,
  type Owner,
  type TestApp,
} from '../support/test-app.js';

describe('Storefront: restaurants and current menu for diners', () => {
  let testApp: TestApp;
  let owner: Owner;
  let slug: string;
  let menuId: string;

  const http = () => testApp.http();

  beforeAll(async () => {
    testApp = await createTestApp('restaurant_api_storefront');
    owner = await registerOwner(testApp, 'sofia');
    const restaurant = await http()
      .get(`/restaurants/${owner.restaurantId}`)
      .set(as(owner.token))
      .expect(200);
    slug = restaurant.body.data.slug;

    const lomo = await createProduct(testApp, owner, { name: 'Lomo saltado' });
    const cafe = await createProduct(testApp, owner, {
      name: 'Café americano',
      price: 8,
    });
    const agotado = await createProduct(testApp, owner, {
      name: 'Ají de gallina',
      description: 'Con papas amarillas',
      isAvailable: false,
    });
    const retirado = await createProduct(testApp, owner, { name: 'Retirado' });
    await http()
      .delete(`/products/${retirado}`)
      .set(as(owner.token))
      .expect(200);

    const menu = await http()
      .post('/menus')
      .set(as(owner.token))
      .send({ restaurantId: owner.restaurantId, name: 'Carta' })
      .expect(201);
    menuId = menu.body.data.id;
    const bebidas = await http()
      .post(`/menus/${menuId}/sections`)
      .set(as(owner.token))
      .send({ name: 'Bebidas', sortOrder: 2 })
      .expect(201);
    const fondos = await http()
      .post(`/menus/${menuId}/sections`)
      .set(as(owner.token))
      .send({ name: 'Fondos', sortOrder: 1 })
      .expect(201);
    const add = (productId: string, body: Record<string, unknown>) =>
      http()
        .post(`/menus/${menuId}/products`)
        .set(as(owner.token))
        .send({ productId, ...body })
        .expect(201);
    await add(cafe, { menuSectionId: bebidas.body.data.id });
    await add(lomo, { menuSectionId: fondos.body.data.id, sortOrder: 2 });
    await add(agotado, { menuSectionId: fondos.body.data.id, sortOrder: 1 });
    await add(retirado, { menuSectionId: fondos.body.data.id });
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it('lists active restaurants without login, with their service types', async () => {
    const response = await http().get('/api/v1/restaurants').expect(200);
    const listed = response.body.data.items.find(
      (item: { id: string }) => item.id === owner.restaurantId,
    );
    expect(listed.slug).toBe(slug);
    expect(listed.organizationId).toBeUndefined();
    expect(
      listed.services.map((service: { mode: string }) => service.mode),
    ).toEqual(['DINE_IN']);
  });

  it('finds a restaurant by id and by slug', async () => {
    const byId = await http()
      .get(`/api/v1/restaurants/${owner.restaurantId}`)
      .expect(200);
    expect(byId.body.data.slug).toBe(slug);
    const bySlug = await http()
      .get(`/api/v1/restaurants/slug/${slug}`)
      .expect(200);
    expect(bySlug.body.data.id).toBe(owner.restaurantId);
    await http().get('/api/v1/restaurants/slug/no-existe').expect(404);
  });

  it('returns an empty menu while no menu is active', async () => {
    const response = await http()
      .get(`/api/v1/restaurants/${owner.restaurantId}/menu`)
      .expect(200);
    expect(response.body.data.menu).toBeNull();
    expect(response.body.data.products).toEqual([]);
  });

  describe('with the menu active', () => {
    beforeAll(async () => {
      await http()
        .patch(`/menus/${menuId}`)
        .set(as(owner.token))
        .send({ status: 'ACTIVE' })
        .expect(200);
    });

    it('shows sections and products in order, sold out included, retired excluded', async () => {
      const response = await http()
        .get(`/api/v1/restaurants/${owner.restaurantId}/menu`)
        .expect(200);
      const { menu, sections, products } = response.body.data;
      expect(menu.id).toBe(menuId);
      expect(sections.map((section: { name: string }) => section.name)).toEqual(
        ['Fondos', 'Bebidas'],
      );
      expect(
        products.map((product: { name: string; isAvailable: boolean }) => [
          product.name,
          product.isAvailable,
        ]),
      ).toEqual([
        ['Ají de gallina', false],
        ['Lomo saltado', true],
        ['Café americano', true],
      ]);
    });

    it('suggests products ignoring case and accents', async () => {
      const response = await http()
        .get(`/api/v1/restaurants/${owner.restaurantId}/menu/search`)
        .query({ q: 'CAFE' })
        .expect(200);
      expect(
        response.body.data.map((product: { name: string }) => product.name),
      ).toEqual(['Café americano']);
      const byDescription = await http()
        .get(`/api/v1/restaurants/${owner.restaurantId}/menu/search`)
        .query({ q: 'papas', limit: 1 })
        .expect(200);
      expect(byDescription.body.data).toHaveLength(1);
    });
  });

  it('hides an inactive restaurant', async () => {
    const other = await registerOwner(testApp, 'tomas');
    await http()
      .delete(`/restaurants/${other.restaurantId}`)
      .set(as(other.token))
      .expect(200);
    await http().get(`/api/v1/restaurants/${other.restaurantId}`).expect(404);
    await http()
      .get(`/api/v1/restaurants/${other.restaurantId}/menu`)
      .expect(404);
    const list = await http().get('/api/v1/restaurants').expect(200);
    expect(
      list.body.data.items.some(
        (item: { id: string }) => item.id === other.restaurantId,
      ),
    ).toBe(false);
  });
});
