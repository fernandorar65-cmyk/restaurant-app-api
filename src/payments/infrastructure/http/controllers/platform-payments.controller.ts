import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';
import { PlatformAdmin } from '../../../../common/infrastructure/http/platform-admin.decorator.js';
import { PaymentCatalogService } from '../../../application/payment-catalog/payment-catalog.service.js';
import { ProviderEventsService } from '../../../application/provider-events/provider-events.service.js';
import { PaymentStatusCode } from '../../../domain/enums/payment-status-code.enum.js';
import {
  CreateProviderStatusMappingDto,
  PaymentStatusResponseDto,
  ProviderEventDto,
  ProviderEventResponseDto,
  ProviderStatusMappingResponseDto,
  RenamePaymentStatusDto,
  UpdateProviderStatusMappingDto,
} from '../dto/platform-payments.dto.js';

/**
 * Private ACMR API (platform administrators only): payment status catalog,
 * translation of each gateway's statuses and gateway event intake/audit.
 */
@ApiTags('platform/payments')
@ApiForbiddenResponse({ description: 'Solo administradores de ACMR' })
@PlatformAdmin()
@Controller('platform')
export class PlatformPaymentsController {
  constructor(
    private readonly catalogService: PaymentCatalogService,
    private readonly eventsService: ProviderEventsService,
  ) {}

  @Get('payment-statuses')
  @ApiOperation({ summary: 'Catálogo de estados internos de pago' })
  @ApiOkResponse({ type: [PaymentStatusResponseDto] })
  async listStatuses(): Promise<PaymentStatusResponseDto[]> {
    const statuses = await this.catalogService.listStatuses();
    return statuses.map((status) => PaymentStatusResponseDto.fromDomain(status));
  }

  @Patch('payment-statuses/:code')
  @ApiOperation({
    summary: 'Cambiar el nombre visible o la descripción de un estado',
    description: 'El código y el efecto contable no se pueden cambiar',
  })
  @ApiOkResponse({ type: PaymentStatusResponseDto })
  async renameStatus(
    @Param('code', new ParseEnumPipe(PaymentStatusCode)) code: PaymentStatusCode,
    @Body() dto: RenamePaymentStatusDto,
  ): Promise<PaymentStatusResponseDto> {
    return PaymentStatusResponseDto.fromDomain(await this.catalogService.renameStatus(code, dto));
  }

  @Get('payment-provider-status-mappings')
  @ApiOperation({ summary: 'Mapeos de estados de pasarela a estados internos' })
  @ApiQuery({ name: 'providerCode', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiPaginatedResponse(ProviderStatusMappingResponseDto)
  async findMappings(
    @Pagination() page: PageRequest,
    @Query('providerCode') providerCode?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
  ): Promise<PageResponse<ProviderStatusMappingResponseDto>> {
    const mappings = await this.catalogService.findMappings({ providerCode, isActive }, page);
    return toPageResponse(mappings, (mapping) => ProviderStatusMappingResponseDto.fromDomain(mapping));
  }

  @Post('payment-provider-status-mappings')
  @ApiOperation({ summary: 'Incorporar un estado externo de una pasarela' })
  @ApiCreatedResponse({ type: ProviderStatusMappingResponseDto })
  async createMapping(
    @Body() dto: CreateProviderStatusMappingDto,
  ): Promise<ProviderStatusMappingResponseDto> {
    return ProviderStatusMappingResponseDto.fromDomain(await this.catalogService.createMapping(dto));
  }

  @Patch('payment-provider-status-mappings/:id')
  @ApiOperation({ summary: 'Activar, desactivar o cambiar el estado interno de un mapeo' })
  @ApiOkResponse({ type: ProviderStatusMappingResponseDto })
  async updateMapping(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProviderStatusMappingDto,
  ): Promise<ProviderStatusMappingResponseDto> {
    return ProviderStatusMappingResponseDto.fromDomain(
      await this.catalogService.updateMapping(id, dto),
    );
  }

  @Post('payment-providers/:providerCode/events')
  @ApiOperation({
    summary: 'Registrar un evento de una pasarela (idempotente por eventId)',
    description:
      'Traduce el estado externo con los mapeos activos y actualiza el pago. Un evento repetido no se vuelve a aplicar (200 con duplicate=true). Los webhooks públicos con firma de cada pasarela se agregarán al integrar un proveedor',
  })
  @ApiCreatedResponse({ type: ProviderEventResponseDto })
  async receiveEvent(
    @Param('providerCode') providerCode: string,
    @Body() dto: ProviderEventDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ProviderEventResponseDto> {
    const { event, duplicate } = await this.eventsService.receive(providerCode, dto);
    response.status(duplicate ? HttpStatus.OK : HttpStatus.CREATED);
    return ProviderEventResponseDto.fromDomain(event, duplicate);
  }

  @Get('payment-provider-events')
  @ApiOperation({ summary: 'Auditoría de eventos recibidos de pasarelas' })
  @ApiQuery({ name: 'providerCode', required: false })
  @ApiPaginatedResponse(ProviderEventResponseDto)
  async findEvents(
    @Pagination() page: PageRequest,
    @Query('providerCode') providerCode?: string,
  ): Promise<PageResponse<ProviderEventResponseDto>> {
    const events = await this.eventsService.findPage({ providerCode }, page);
    return toPageResponse(events, (event) => ProviderEventResponseDto.fromDomain(event));
  }
}
