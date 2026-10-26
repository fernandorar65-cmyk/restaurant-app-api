import { Body, Controller, Get, HttpStatus, Param, ParseUUIDPipe, Post, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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

/** Movements are immutable: no PATCH or DELETE, only reversal. */
@ApiTags('inventory/movements')
@Controller('inventory-movements')
export class InventoryMovementsController {
  constructor(private readonly restaurantSuppliesService: RestaurantSuppliesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un movimiento' })
  @ApiOkResponse({ type: InventoryMovementResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<InventoryMovementResponseDto> {
    return InventoryMovementResponseDto.fromDomain(
      await this.restaurantSuppliesService.findMovement(id),
    );
  }

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
