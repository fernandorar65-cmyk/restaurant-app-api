import type { INestApplication } from '@nestjs/common';
import { ApiExtension, DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

/**
 * Who may call an operation, as the access decorators (@Public,
 * @Authenticated, @Authorize, @PlatformAdmin) record it for the docs.
 */
export type AccessDoc =
  | { type: 'public' }
  | { type: 'session' }
  | { type: 'platform' }
  | { type: 'tenant'; permission: string | null };

export const ACCESS_EXTENSION = 'x-access';

export const ApiAccess = (access: AccessDoc) =>
  ApiExtension(ACCESS_EXTENSION, access);

type Schema = Record<string, unknown>;
type Operation = {
  description?: string;
  parameters?: { in: string; name: string; schema?: Schema }[];
  requestBody?: unknown;
  responses: Record<
    string,
    { description?: string; content?: Record<string, { schema?: Schema }> }
  >;
  security?: unknown[];
  [ACCESS_EXTENSION]?: AccessDoc;
};

const SUCCESS_ENVELOPE = 'ApiSuccessResponse';
const ERROR_RESPONSE = 'ApiErrorResponse';

/** Exactly what TransformInterceptor and HttpExceptionFilter send. */
const SCHEMAS: Record<string, Schema> = {
  [SUCCESS_ENVELOPE]: {
    type: 'object',
    required: ['success', 'statusCode', 'message', 'data', 'timestamp', 'path'],
    properties: {
      success: { type: 'boolean', example: true },
      statusCode: { type: 'integer', example: 200 },
      message: { type: 'string', example: 'Request successful' },
      data: { description: 'Contenido de la respuesta (ver cada operación)' },
      timestamp: { type: 'string', format: 'date-time' },
      path: {
        type: 'string',
        example: '/products/7c1e6f2a-2222-4b3a-9a1a-9f3b2c1d4e5f',
      },
    },
  },
  [ERROR_RESPONSE]: {
    type: 'object',
    required: [
      'success',
      'statusCode',
      'errorCode',
      'message',
      'data',
      'timestamp',
      'path',
    ],
    properties: {
      success: { type: 'boolean', example: false },
      statusCode: { type: 'integer', example: 404 },
      errorCode: {
        type: 'string',
        example: 'PRODUCT_NOT_FOUND',
        description: 'Código estable para decidir en el cliente (no el texto)',
      },
      message: {
        oneOf: [
          { type: 'string' },
          { type: 'array', items: { type: 'string' } },
        ],
        example: 'No existe el producto con id "…"',
        description: 'En español; lista de mensajes en errores de validación',
      },
      data: { type: 'object', nullable: true, example: null },
      timestamp: { type: 'string', format: 'date-time' },
      path: { type: 'string' },
      requestId: {
        type: 'string',
        description:
          'Igual al header X-Request-Id: sirve para encontrar el error en los logs',
      },
    },
  },
};

const SUCCESS_TEXT: Record<string, string> = {
  '200': 'OK',
  '201': 'Creado',
};

const ERRORS: Record<string, string> = {
  '400': 'Datos inválidos (VALIDATION_ERROR o una regla de forma del dominio)',
  '401':
    'Sin sesión o token inválido (MISSING_ACCESS_TOKEN / INVALID_ACCESS_TOKEN)',
  '403':
    'Sin acceso a esta organización o sede, o sin el permiso requerido (ACCESS_DENIED)',
  '404': 'El recurso no existe',
};

const ACCESS_TEXT: Record<AccessDoc['type'], (access: AccessDoc) => string> = {
  public: () => 'Pública: no requiere sesión.',
  session: () => 'Requiere sesión.',
  platform: () =>
    'Solo administradores de la plataforma (users.is_platform_admin).',
  tenant: (access) => {
    const permission = (access as { permission: string | null }).permission;
    return permission
      ? `Requiere el permiso \`${permission}\` en la organización/sede del recurso.`
      : 'Requiere ser miembro de la organización/sede del recurso.';
  },
};

/** The document served at /docs (main.ts) and checked by the e2e tests. */
export function createOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Restaurant API')
    .setDescription(
      'API para la gestión de un restaurante. Toda respuesta viene en un sobre: `data` en las exitosas, `errorCode` y `message` en los errores. Requiere `Authorization: Bearer <accessToken>` salvo en las rutas marcadas como públicas.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    // Session is required by default; public routes are marked @Public().
    .addSecurityRequirements('bearer')
    .build();
  return finalizeOpenApiDocument(SwaggerModule.createDocument(app, config));
}

/**
 * Makes the generated document describe the wire format instead of the
 * handlers' return types: every success body inside the response envelope,
 * the shared error body, who may call each operation and no lock on public
 * routes. Explicit error responses of an operation are kept.
 */
export function finalizeOpenApiDocument(
  document: OpenAPIObject,
): OpenAPIObject {
  document.components = {
    ...document.components,
    schemas: { ...document.components?.schemas, ...SCHEMAS },
  };
  for (const pathItem of Object.values(document.paths)) {
    for (const [method, value] of Object.entries(pathItem)) {
      if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
        continue;
      }
      finalizeOperation(value as Operation);
    }
  }
  return document;
}

function finalizeOperation(operation: Operation): void {
  const access = operation[ACCESS_EXTENSION];
  for (const [status, response] of Object.entries(operation.responses)) {
    if (status === '204') {
      continue;
    }
    if (status.startsWith('2')) {
      response.description ||= SUCCESS_TEXT[status] ?? 'OK';
      wrapInEnvelope(response);
    } else {
      useErrorSchema(response);
    }
  }
  const parameters = operation.parameters ?? [];
  // Every :id / :somethingId of the API goes through ParseUUIDPipe.
  for (const parameter of parameters) {
    if (parameter.in === 'path' && /^(id|\w+Id)$/.test(parameter.name)) {
      parameter.schema = {
        ...parameter.schema,
        type: 'string',
        format: 'uuid',
      };
    }
  }
  const expected: string[] = [];
  if (operation.requestBody || parameters.length > 0) {
    expected.push('400');
  }
  if (access?.type !== 'public') {
    expected.push('401');
  }
  if (access?.type === 'platform' || access?.type === 'tenant') {
    expected.push('403');
  }
  if (parameters.some((parameter) => parameter.in === 'path')) {
    expected.push('404');
  }
  for (const status of expected) {
    if (!operation.responses[status]) {
      operation.responses[status] = { description: ERRORS[status] };
      useErrorSchema(operation.responses[status]);
    }
  }
  if (access?.type === 'public') {
    operation.security = [];
  }
  if (access) {
    const text = ACCESS_TEXT[access.type](access);
    operation.description = operation.description
      ? `${operation.description}\n\n${text}`
      : text;
  }
}

function wrapInEnvelope(response: Operation['responses'][string]): void {
  const json = response.content?.['application/json'];
  const data = json?.schema ?? {
    type: 'object',
    nullable: true,
    example: null,
  };
  response.content = {
    ...response.content,
    'application/json': {
      schema: {
        allOf: [
          { $ref: `#/components/schemas/${SUCCESS_ENVELOPE}` },
          { type: 'object', properties: { data } },
        ],
      },
    },
  };
}

function useErrorSchema(response: Operation['responses'][string]): void {
  response.content = {
    'application/json': {
      schema: { $ref: `#/components/schemas/${ERROR_RESPONSE}` },
    },
  };
}
