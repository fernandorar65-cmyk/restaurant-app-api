import type { OpenAPIObject } from '@nestjs/swagger';
import { createOpenApiDocument } from '../../src/common/infrastructure/http/openapi.js';
import { createTestApp, type TestApp } from '../support/test-app.js';

type Schema = {
  type?: string;
  $ref?: string;
  enum?: unknown[];
  allOf?: unknown[];
  oneOf?: unknown[];
  items?: Schema;
  properties?: Record<string, Schema>;
  additionalProperties?: unknown;
};
type Operation = {
  summary?: string;
  tags?: string[];
  security?: unknown[];
  parameters?: { in: string; name: string; schema?: Schema }[];
  responses: Record<
    string,
    { description?: string; content?: Record<string, { schema: Schema }> }
  >;
  'x-access'?: { type: string };
};

/** Envelope pieces that are generic on purpose: each operation narrows `data`. */
const GENERIC = new Set(['ApiSuccessResponse.data', 'ApiErrorResponse.data']);

// Guards the /docs contract: every route and DTO must say what it really
// receives and returns, so the front can rely on Swagger.
describe('OpenAPI document', () => {
  let testApp: TestApp;
  let document: OpenAPIObject;
  let operations: [string, Operation][];

  beforeAll(async () => {
    testApp = await createTestApp('restaurant_api_openapi');
    document = createOpenApiDocument(testApp.app);
    operations = Object.entries(document.paths).flatMap(([path, item]) =>
      Object.entries(item)
        .filter(([method]) =>
          ['get', 'post', 'put', 'patch', 'delete'].includes(method),
        )
        .map(([method, operation]): [string, Operation] => [
          `${method.toUpperCase()} ${path}`,
          operation as Operation,
        ]),
    );
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it('gives every operation a summary, a tag and an access policy', () => {
    const missing = operations
      .filter(([, op]) => !op.summary || !op.tags?.length || !op['x-access'])
      .map(([name]) => name);
    expect(missing).toEqual([]);
  });

  it('only drops the bearer requirement on public routes', () => {
    const wrong = operations
      .filter(
        ([, op]) =>
          (op['x-access']?.type === 'public') !== (op.security?.length === 0),
      )
      .map(([name]) => name);
    expect(wrong).toEqual([]);
  });

  it('documents every success body inside the envelope, with its data', () => {
    const wrong: string[] = [];
    for (const [name, op] of operations) {
      for (const [status, response] of Object.entries(op.responses)) {
        if (!status.startsWith('2') || status === '204') {
          continue;
        }
        const schema = response.content?.['application/json']?.schema;
        const data = (schema?.allOf?.[1] as Schema | undefined)?.properties
          ?.data;
        if (!data || (!data.$ref && !data.type && !data.allOf && !data.oneOf)) {
          wrong.push(`${name} ${status}`);
        } else if (
          data.type === 'object' &&
          !data.properties &&
          !data.additionalProperties
        ) {
          wrong.push(`${name} ${status}: data sin forma`);
        }
      }
    }
    expect(wrong).toEqual([]);
  });

  it('documents errors with the shared error body', () => {
    const wrong = operations.flatMap(([name, op]) =>
      Object.entries(op.responses)
        .filter(([status]) => /^[45]/.test(status))
        .filter(
          ([, response]) =>
            response.content?.['application/json']?.schema.$ref !==
            '#/components/schemas/ApiErrorResponse',
        )
        .map(([status]) => `${name} ${status}`),
    );
    expect(wrong).toEqual([]);
  });

  it('types every query parameter', () => {
    const untyped = operations.flatMap(([name, op]) =>
      (op.parameters ?? [])
        .filter((parameter) => parameter.in === 'query')
        .filter(
          (parameter) => !parameter.schema?.type && !parameter.schema?.enum,
        )
        .map((parameter) => `${name} ?${parameter.name}`),
    );
    expect(untyped).toEqual([]);
  });

  it('gives every DTO property a real type (no nullable unions left as object)', () => {
    const wrong: string[] = [];
    const visit = (where: string, schema: Schema | undefined) => {
      if (
        !schema ||
        schema.$ref ||
        schema.allOf ||
        schema.oneOf ||
        GENERIC.has(where)
      ) {
        return;
      }
      if (schema.type === 'array') {
        if (
          !schema.items ||
          (!schema.items.type && !schema.items.$ref && !schema.items.enum)
        ) {
          wrong.push(`${where}: array sin items`);
        } else {
          visit(`${where}[]`, schema.items);
        }
        return;
      }
      if (!schema.type && !schema.enum) {
        wrong.push(`${where}: sin tipo`);
        return;
      }
      if (schema.type === 'object') {
        if (!schema.properties && !schema.additionalProperties) {
          wrong.push(`${where}: object vacío`);
        }
        for (const [property, child] of Object.entries(
          schema.properties ?? {},
        )) {
          visit(`${where}.${property}`, child);
        }
      }
    };
    for (const [name, schema] of Object.entries(
      document.components?.schemas ?? {},
    )) {
      for (const [property, child] of Object.entries(
        (schema as Schema).properties ?? {},
      )) {
        visit(`${name}.${property}`, child);
      }
    }
    expect(wrong).toEqual([]);
  });
});
