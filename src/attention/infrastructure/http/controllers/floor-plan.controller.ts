import { Controller, Get, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { FloorPlanService } from '../../../application/floor-plan/floor-plan.service.js';
import { FloorPlanResponseDto } from '../dto/floor-plan.dto.js';
import {
  Authorize,
  Scope,
} from '../../../../common/infrastructure/http/access/authorize.decorator.js';

@ApiTags('attention/floor-plan')
@Controller('floor-plan')
export class FloorPlanController {
  constructor(private readonly floorPlan: FloorPlanService) {}

  @Authorize(null, Scope.restaurant('query'))
  @Get()
  @ApiOperation({
    summary: 'Plano de la sala: pisos, mesas con su ocupación y KPIs',
    description:
      'Cada mesa trae su atención activa (total, pagado y saldo). Pensado para consultarse seguido: solo lee atenciones activas',
  })
  @ApiQuery({ name: 'restaurantId', required: true })
  @ApiOkResponse({ type: FloorPlanResponseDto })
  @ApiNotFoundResponse({ description: 'Restaurante no encontrado' })
  async get(
    @Query('restaurantId', ParseUUIDPipe) restaurantId: string,
  ): Promise<FloorPlanResponseDto> {
    return FloorPlanResponseDto.from(
      await this.floorPlan.getFloorPlan(restaurantId),
    );
  }
}
