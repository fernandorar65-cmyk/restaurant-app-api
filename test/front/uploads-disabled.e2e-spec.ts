import {
  as,
  createTestApp,
  registerOwner,
  type TestApp,
} from '../support/test-app.js';

// Own file: ConfigModule reads the environment once per test file.
describe('Uploads without a storage configured', () => {
  let testApp: TestApp;
  let previousProvider: string | undefined;

  beforeAll(async () => {
    previousProvider = process.env.STORAGE_PROVIDER;
    process.env.STORAGE_PROVIDER = '';
    testApp = await createTestApp('restaurant_api_uploads_off');
  });

  afterAll(async () => {
    await testApp?.close();
    process.env.STORAGE_PROVIDER = previousProvider;
  });

  it('answers 503 until STORAGE_PROVIDER is set', async () => {
    const owner = await registerOwner(testApp, 'zoe');
    const response = await testApp
      .http()
      .post('/uploads/images')
      .query({ restaurantId: owner.restaurantId })
      .set(as(owner.token))
      .attach('file', Buffer.from('fake'), {
        filename: 'x.png',
        contentType: 'image/png',
      })
      .expect(503);
    expect(response.body.errorCode).toBe('FILE_STORAGE_NOT_CONFIGURED');
  });
});
