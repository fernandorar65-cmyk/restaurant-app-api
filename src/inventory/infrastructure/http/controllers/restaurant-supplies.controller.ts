import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  CurrentUser,
  type RequestUser,
} from '../../../../common/infrastructure/http/current-user.decorator.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';
import { RestaurantSuppliesService } from '../../../application/restaurant-supplies/restaurant-supplies.service.js';
import {
  ConfigureRestaurantSupplyDto,
  CountDto,
  EnableRestaurantSupplyDto,
  InventoryMovementResponseDto,
  MovementResultResponseDto,
  RegisterMovementDto,
  RestaurantSupplyResponseDto,
} from '../dto/restaurant-supply.dto.js';

/** Stock of each restaurant: balance, minimum, average cost and its movements. */
@ApiTags('inventory/restaurant-supplies')
@Controller('restaurant-supplies')
export class RestaurantSuppliesController {
  constructor(private readonly restaurantSuppliesService: RestaurantSuppliesService) {}

  @Post()
  @ApiOperation({ summary: 'Habilitar un insumo maestro en una sede (stock 0)' })
  @ApiCreatedResponse({ type: RestaurantSupplyResponseDto })
  async enable(@Body() dto: EnableRestaurantSupplyDto): Promise<RestaurantSupplyResponseDto> {
    return RestaurantSupplyResponseDto.fromView(await this.restaurantSuppliesService.enable(dto));
  }

  @Get()
  @ApiOperation({ summary: 'Stock de las sedes' })
  @ApiQuery({ name: 'restaurantId', required: false })
  @ApiQuery({ name: 'supplyId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'lowStock', required: false, type: Boolean, description: 'Solo los que llegaron o bajaron del mínimo' })
  @ApiPaginatedResponse(RestaurantSupplyResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('restaurantId', new ParseUUIDPipe({ optional: true })) restaurantId?: string,
    @Query('supplyId', new ParseUUIDPipe({ optional: true })) supplyId?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
    @Query('lowStock', new ParseBoolPipe({ optional: true })) lowStock?: boolean,
  ): Promise<PageResponse<RestaurantSupplyResponseDto>> {
    const result = await this.restaurantSuppliesService.findPage(
      { restaurantId, supplyId, isActive, lowStock },
      page,
    );
    return toPageResponse(result, (view) => RestaurantSupplyResponseDto.fromView(view));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Stock de un insumo en una sede' })
  @ApiOkResponse({ type: RestaurantSupplyResponseDto })
  @ApiNotFoundResponse({ description: 'No existe' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RestaurantSupplyResponseDto> {
    return RestaurantSupplyResponseDto.fromView(await this.restaurantSuppliesService.findOne(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cambiar el mínimo o activar/desactivar en la sede (el stock no se edita)' })
  @ApiOkResponse({ type: RestaurantSupplyResponseDto })
  async configure(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfigureRestaurantSupplyDto,
  ): Promise<RestaurantSupplyResponseDto> {
    return RestaurantSupplyResponseDto.fromView(
      await this.restaurantSuppliesService.configure(id, dto),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar el insumo en la sede (baja lógica; conserva el historial)' })
  @ApiOkResponse({ description: 'Id del registro desactivado' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.restaurantSuppliesService.deactivate(id);
    return { id };
  }

  @Post(':id/movements')
  @ApiOperation({
    summary: 'Registrar una compra, consumo, merma o ajuste manual',
    description:
      'Saldo y movimiento se guardan juntos con la fila bloqueada. Una salida nunca deja stock negativo (422). Con idempotencyKey repetida devuelve el mismo movimiento (200)',
  })
  @ApiCreatedResponse({ type: MovementResultResponseDto })
  async registerMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterMovementDto,
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MovementResultResponseDto> {
    const result = await this.restaurantSuppliesService.registerMovement(id, {
      type: dto.type,
      quantity: dto.quantity,
      unitCost: dto.unitCost,
      notes: dto.notes,
      idempotencyKey: dto.idempotencyKey,
      createdByUserId: user.id,
    });
    response.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return MovementResultResponseDto.from(result);
  }

  @Post(':id/counts')
  @ApiOperation({
    summary: 'Registrar un conteo físico',
    description:
      'El backend calcula la diferencia y crea COUNT_ADJUSTMENT_IN / OUT con la cantidad contada. Sin diferencia no crea movimiento (200, movement = null)',
  })
  @ApiCreatedResponse({ type: MovementResultResponseDto })
  async count(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CountDto,
    @CurrentUser() user: RequestUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MovementResultResponseDto> {
    const result = await this.restaurantSuppliesService.count(id, {
      countedQuantity: dto.countedQuantity,
      notes: dto.notes,
      idempotencyKey: dto.idempotencyKey,
      createdByUserId: user.id,
    });
    response.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return MovementResultResponseDto.from(result);
  }

  @Get(':id/movements')
  @ApiOperation({ summary: 'Historial de movimientos (más reciente primero)' })
  @ApiPaginatedResponse(InventoryMovementResponseDto)
  async listMovements(
    @Param('id', ParseUUIDPipe) id: string,
    @Pagination() page: PageRequest,
  ): Promise<PageResponse<InventoryMovementResponseDto>> {
    const movements = await this.restaurantSuppliesService.listMovements(id, page);
    return toPageResponse(movements, (movement) =>
      InventoryMovementResponseDto.fromDomain(movement),
    );
  }
}
