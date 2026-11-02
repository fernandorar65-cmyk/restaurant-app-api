import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { PageRequest } from '../../../../common/domain/pagination.js';
import { ParseBusinessDatePipe } from '../../../../common/infrastructure/http/parse-business-date.pipe.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';
import { MovementTypeCode } from '../../../domain/enums/movement-type-code.enum.js';
import type { Response } from 'express';
import {
  CurrentUser,
  type RequestUser,
} from '../../../../common/infrastructure/http/current-user.decorator.js';
import { RestaurantSuppliesService } from '../../../application/restaurant-supplies/restaurant-supplies.service.js';
import {
  InventoryMovementResponseDto,
  MovementResultResponseDto,
  ReverseMovementDto,
} from '../dto/restaurant-supply.dto.js';
import {
  Authorize,
  Scope,
} from '../../../../common/infrastructure/http/access/authorize.decorator.js';

/** Movements are immutable: no PATCH or DELETE, only reversal. */
@ApiTags('inventory/movements')
@Controller('inventory-movements')
export class InventoryMovementsController {
  constructor(
    private readonly restaurantSuppliesService: RestaurantSuppliesService,
  ) {}

  @Authorize(null, Scope.restaurant('query'))
  @Get()
  @ApiOperation({
    summary: 'Movimientos de todo el stock de una sede (más reciente primero)',
    description:
      'from / to son fechas comerciales (YYYY-MM-DD) en la zona horaria de la sede',
  })
  @ApiQuery({ name: 'restaurantId', required: true })
  @ApiQuery({
    name: 'supplyId',
    required: false,
    description: 'Insumo maestro',
  })
  @ApiQuery({ name: 'type', required: false, enum: MovementTypeCode })
  @ApiQuery({ name: 'from', required: false, example: '2026-10-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-10-31' })
  @ApiPaginatedResponse(InventoryMovementResponseDto)
  async findByRestaurant(
    @Pagination() page: PageRequest,
    @Query('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('supplyId', new ParseUUIDPipe({ optional: true })) supplyId?: string,
    @Query('type', new ParseEnumPipe(MovementTypeCode, { optional: true }))
    type?: MovementTypeCode,
    @Query('from', new ParseBusinessDatePipe({ optional: true })) from?: string,
    @Query('to', new ParseBusinessDatePipe({ optional: true })) to?: string,
  ): Promise<PageResponse<InventoryMovementResponseDto>> {
    const movements =
      await this.restaurantSuppliesService.listRestaurantMovements(
        { restaurantId, supplyId, type, from, to },
        page,
      );
    return toPageResponse(movements, (movement) =>
      InventoryMovementResponseDto.fromDomain(movement),
    );
  }

  @Authorize(null, Scope.resource('inventory-movement'))
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un movimiento' })
  @ApiOkResponse({ type: InventoryMovementResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<InventoryMovementResponseDto> {
    return InventoryMovementResponseDto.fromDomain(
      await this.restaurantSuppliesService.findMovement(id),
    );
  }

  @Authorize('inventory.manage', Scope.resource('inventory-movement'))
  @Post(':id/reverse')
  @ApiOperation({
    summary: 'Revertir un movimiento con otro de signo contrario',
    description:
      'El original no se modifica. Un movimiento se revierte una sola vez (409) y una reversión no se revierte (422)',
  })
  @ApiCreatedResponse({ type: MovementResultResponseDto })
  async reverse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReverseMovementDto,
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MovementResultResponseDto> {
    const result = await this.restaurantSuppliesService.reverse(id, {
      notes: dto.notes,
      idempotencyKey: dto.idempotencyKey,
      createdByUserId: user.id,
    });
    response.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return MovementResultResponseDto.from(result);
  }
}
