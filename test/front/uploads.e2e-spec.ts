import { FILE_STORAGE } from '../../src/media/application/ports/file-storage.port.js';
import type { FileStoragePort } from '../../src/media/application/ports/file-storage.port.js';
import {
  as,
  createTestApp,
  registerOwner,
  type Owner,
  type TestApp,
} from '../support/test-app.js';

// Smallest valid PNG (1x1 transparent pixel).
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

class InMemoryFileStorage implements FileStoragePort {
  readonly files = new Map<string, { body: Buffer; contentType: string }>();

  upload(file: { key: string; body: Buffer; contentType: string }) {
    this.files.set(file.key, file);
    return Promise.resolve({
      key: file.key,
      url: `https://cdn.test/${file.key}`,
    });
  }
}

describe('Uploads: restaurant images', () => {
  describe('with a storage configured', () => {
    let testApp: TestApp;
    let owner: Owner;
    const storage = new InMemoryFileStorage();

    beforeAll(async () => {
      testApp = await createTestApp('restaurant_api_uploads', (builder) =>
        builder.overrideProvider(FILE_STORAGE).useValue(storage),
      );
      owner = await registerOwner(testApp, 'wendy');
    });

    afterAll(async () => {
      await testApp?.close();
    });

    it('stores the image in the restaurant folder and returns its URL', async () => {
      const response = await testApp
        .http()
        .post('/uploads/images')
        .query({ restaurantId: owner.restaurantId })
        .set(as(owner.token))
        .attach('file', PNG, {
          filename: '../../etc/passwd.png',
          contentType: 'image/png',
        })
        .expect(201);
      const { key, url } = response.body.data;
      expect(key).toMatch(
        new RegExp(
          `^restaurants/${owner.restaurantId}/images/[0-9a-f-]{36}\\.png$`,
        ),
      );
      expect(url).toBe(`https://cdn.test/${key}`);
      expect(storage.files.get(key)?.body.equals(PNG)).toBe(true);
    });

    it('rejects files that are not images, and requests without a file', async () => {
      const svg = await testApp
        .http()
        .post('/uploads/images')
        .query({ restaurantId: owner.restaurantId })
        .set(as(owner.token))
        .attach('file', Buffer.from('<svg/>'), {
          filename: 'logo.svg',
          contentType: 'image/svg+xml',
        })
        .expect(400);
      expect(svg.body.errorCode).toBe('UNSUPPORTED_IMAGE_TYPE');
      await testApp
        .http()
        .post('/uploads/images')
        .query({ restaurantId: owner.restaurantId })
        .set(as(owner.token))
        .expect(400);
    });

    it("can't upload to another organization's restaurant", async () => {
      const other = await registerOwner(testApp, 'yolanda');
      await testApp
        .http()
        .post('/uploads/images')
        .query({ restaurantId: owner.restaurantId })
        .set(as(other.token))
        .attach('file', PNG, { filename: 'x.png', contentType: 'image/png' })
        .expect(403);
    });
  });
});
