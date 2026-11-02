import { ApiProperty } from '@nestjs/swagger';

/** Body of a logical delete / removal: the id it acted on. */
export class IdResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;
}

/** Swagger schema of a response made of ids, e.g. { menuId, productId }. */
export function idsSchema(...names: string[]) {
  return {
    type: 'object' as const,
    required: names,
    properties: Object.fromEntries(
      names.map((name) => [name, { type: 'string', format: 'uuid' }]),
    ),
  };
}
