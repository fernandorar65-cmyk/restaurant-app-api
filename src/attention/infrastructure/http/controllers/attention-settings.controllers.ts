import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ServiceTypesService } from '../../../application/attention-settings/service-types.service.js';
import { WorkflowStatusesService } from '../../../application/attention-settings/workflow-statuses.service.js';
import { WorkflowKind } from '../../../domain/workflows.js';
import {
  CreateAttentionStatusDto,
  CreateOrderStatusDto,
  CreateServiceTypeDto,
  ServiceTypeResponseDto,
  UpdateServiceTypeDto,
  UpdateWorkflowStatusDto,
  WorkflowStatusResponseDto,
} from '../dto/attention-settings.dto.js';
import {
  Authorize,
  Scope,
} from '../../../../common/infrastructure/http/access/authorize.decorator.js';

@ApiTags('attention/settings')
@Controller('attention-statuses')
export class AttentionStatusesController {
  constructor(private readonly statuses: WorkflowStatusesService) {}

  @Authorize(null, Scope.restaurant('query'))
  @Get()
  @ApiOperation({
    summary:
      'Estados comerciales de atención de una sede (activos e inactivos)',
  })
  @ApiQuery({ name: 'restaurantId', required: true })
  @ApiOkResponse({ type: [WorkflowStatusResponseDto] })
  async list(
    @Query('restaurantId', ParseUUIDPipe) restaurantId: string,
  ): Promise<WorkflowStatusResponseDto[]> {
    const statuses = await this.statuses.list(
      WorkflowKind.ATTENTION,
      restaurantId,
    );
    return statuses.map((status) =>
      WorkflowStatusResponseDto.fromDomain(status),
    );
  }

  @Authorize('settings.manage', Scope.restaurant('body'))
  @Post()
  @ApiOperation({ summary: 'Crear un estado de atención propio de la sede' })
  @ApiCreatedResponse({ type: WorkflowStatusResponseDto })
  async create(
    @Body() dto: CreateAttentionStatusDto,
  ): Promise<WorkflowStatusResponseDto> {
    return WorkflowStatusResponseDto.fromDomain(
      await this.statuses.create(WorkflowKind.ATTENTION, dto),
    );
  }

  @Authorize('settings.manage', Scope.resource('attention-status'))
  @Patch(':id')
  @ApiOperation({
    summary:
      'Renombrar, ordenar, marcar inicial o desactivar un estado de atención',
  })
  @ApiOkResponse({ type: WorkflowStatusResponseDto })
  @ApiNotFoundResponse({ description: 'Estado no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkflowStatusDto,
  ): Promise<WorkflowStatusResponseDto> {
    return WorkflowStatusResponseDto.fromDomain(
      await this.statuses.update(WorkflowKind.ATTENTION, id, dto),
    );
  }
}

@ApiTags('attention/settings')
@Controller('order-statuses')
export class OrderStatusesController {
  constructor(private readonly statuses: WorkflowStatusesService) {}

  @Authorize(null, Scope.restaurant('query'))
  @Get()
  @ApiOperation({
    summary: 'Estados operativos de órdenes y platos de una sede',
  })
  @ApiQuery({ name: 'restaurantId', required: true })
  @ApiOkResponse({ type: [WorkflowStatusResponseDto] })
  async list(
    @Query('restaurantId', ParseUUIDPipe) restaurantId: string,
  ): Promise<WorkflowStatusResponseDto[]> {
    const statuses = await this.statuses.list(WorkflowKind.ORDER, restaurantId);
    return statuses.map((status) =>
      WorkflowStatusResponseDto.fromDomain(status),
    );
  }

  @Authorize('settings.manage', Scope.restaurant('body'))
  @Post()
  @ApiOperation({
    summary: 'Crear un estado operativo propio de la sede (p. ej. "En horno")',
  })
  @ApiCreatedResponse({ type: WorkflowStatusResponseDto })
  async create(
    @Body() dto: CreateOrderStatusDto,
  ): Promise<WorkflowStatusResponseDto> {
    return WorkflowStatusResponseDto.fromDomain(
      await this.statuses.create(WorkflowKind.ORDER, dto),
    );
  }

  @Authorize('settings.manage', Scope.resource('order-status'))
  @Patch(':id')
  @ApiOperation({
    summary:
      'Renombrar, ordenar, marcar inicial o desactivar un estado operativo',
  })
  @ApiOkResponse({ type: WorkflowStatusResponseDto })
  @ApiNotFoundResponse({ description: 'Estado no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkflowStatusDto,
  ): Promise<WorkflowStatusResponseDto> {
    return WorkflowStatusResponseDto.fromDomain(
      await this.statuses.update(WorkflowKind.ORDER, id, dto),
    );
  }
}

@ApiTags('attention/settings')
@Controller('service-types')
export class ServiceTypesController {
  constructor(private readonly serviceTypes: ServiceTypesService) {}

  @Authorize(null, Scope.restaurant('query'))
  @Get()
  @ApiOperation({
    summary: 'Tipos de servicio de una sede (activos e inactivos)',
  })
  @ApiQuery({ name: 'restaurantId', required: true })
  @ApiOkResponse({ type: [ServiceTypeResponseDto] })
  async list(
    @Query('restaurantId', ParseUUIDPipe) restaurantId: string,
  ): Promise<ServiceTypeResponseDto[]> {
    const serviceTypes = await this.serviceTypes.list(restaurantId);
    return serviceTypes.map((serviceType) =>
      ServiceTypeResponseDto.fromDomain(serviceType),
    );
  }

  @Authorize('settings.manage', Scope.restaurant('body'))
  @Post()
  @ApiOperation({ summary: 'Crear un tipo de servicio de la sede' })
  @ApiCreatedResponse({ type: ServiceTypeResponseDto })
  async create(
    @Body() dto: CreateServiceTypeDto,
  ): Promise<ServiceTypeResponseDto> {
    return ServiceTypeResponseDto.fromDomain(
      await this.serviceTypes.create(dto),
    );
  }

  @Authorize('settings.manage', Scope.resource('service-type'))
  @Patch(':id')
  @ApiOperation({
    summary: 'Configurar, ordenar o retirar un tipo de servicio',
  })
  @ApiOkResponse({ type: ServiceTypeResponseDto })
  @ApiNotFoundResponse({ description: 'Tipo de servicio no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceTypeDto,
  ): Promise<ServiceTypeResponseDto> {
    return ServiceTypeResponseDto.fromDomain(
      await this.serviceTypes.update(id, dto),
    );
  }
}
