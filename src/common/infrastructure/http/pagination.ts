import {
  applyDecorators,
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  type Type,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiProperty,
  ApiQuery,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { Page, PageRequest } from '../../application/pagination.js';

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

function parsePositiveInt(raw: unknown, name: string, fallback: number): number {
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new BadRequestException({
      message: `${name} debe ser un entero mayor o igual a 1`,
      errorCode: 'VALIDATION_ERROR',
    });
  }
  return value;
}

/**
 * Reads ?page=&limit= from the query string. Kept apart from the endpoint
 * filters so list endpoints don't need a query DTO per resource.
 */
export const Pagination = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PageRequest => {
    const { query } = ctx.switchToHttp().getRequest<Request>();
    const page = parsePositiveInt(query.page, 'page', 1);
    const limit = parsePositiveInt(query.limit, 'limit', DEFAULT_PAGE_LIMIT);
    if (limit > MAX_PAGE_LIMIT) {
      throw new BadRequestException({
        message: `limit no puede ser mayor a ${MAX_PAGE_LIMIT}`,
        errorCode: 'VALIDATION_ERROR',
      });
    }
    return { page, limit };
  },
);

export class PageMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: DEFAULT_PAGE_LIMIT })
  limit: number;

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export interface PageResponse<T> {
  items: T[];
  meta: PageMetaDto;
}

export function toPageResponse<T, R>(
  page: Page<T>,
  map: (item: T) => R,
): PageResponse<R> {
  return {
    items: page.items.map(map),
    meta: {
      page: page.page,
      limit: page.limit,
      total: page.total,
      totalPages: Math.ceil(page.total / page.limit),
    },
  };
}

/** Swagger: documents ?page&limit and the { items, meta } envelope. */
export function ApiPaginatedResponse(model: Type<unknown>) {
  return applyDecorators(
    ApiQuery({ name: 'page', required: false, example: 1 }),
    ApiQuery({
      name: 'limit',
      required: false,
      example: DEFAULT_PAGE_LIMIT,
      description: `Máximo ${MAX_PAGE_LIMIT}`,
    }),
    ApiExtraModels(PageMetaDto, model),
    ApiOkResponse({
      schema: {
        properties: {
          items: { type: 'array', items: { $ref: getSchemaPath(model) } },
          meta: { $ref: getSchemaPath(PageMetaDto) },
        },
      },
    }),
  );
}
