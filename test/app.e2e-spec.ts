import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { createTestDatabase, type TestDatabase } from './support/test-database.js';

// Boots the whole HTTP application on a throwaway database built by the
// migrations, so it never depends on the state of the development database.
describe('AppController (e2e)', () => {
  let database: TestDatabase;
  let app: INestApplication<App>;
  let previousDatabase: string | undefined;

  beforeAll(async () => {
    database = await createTestDatabase('restaurant_api_app');
    previousDatabase = process.env.DB_DATABASE;
    process.env.DB_DATABASE = database.name;
    // Imported only now: ConfigModule.forRoot reads the environment when the
    // module is first loaded.
    const { AppModule } = await import('../src/app.module.js');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ logger: false });
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    process.env.DB_DATABASE = previousDatabase;
    await database?.drop();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
