import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
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
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';
import { SuppliesService } from '../../../application/supplies/supplies.service.js';
import { CreateSupplyDto, SupplyResponseDto, UpdateSupplyDto } from '../dto/supply.dto.js';

/** Master catalog of supplies of an organization; stock lives per restaurant. */
@ApiTags('inventory/supplies')
@Controller('supplies')
export class SuppliesController {
  constructor(private readonly suppliesService: SuppliesService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un insumo en el catálogo de la organización' })
  @ApiCreatedResponse({ type: SupplyResponseDto })
  async create(@Body() dto: CreateSupplyDto): Promise<SupplyResponseDto> {
    return SupplyResponseDto.fromDomain(await this.suppliesService.create(dto));
  }

  @Get()
  @ApiOperation({ summary: 'Listar insumos maestros' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiPaginatedResponse(SupplyResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('organizationId', new ParseUUIDPipe({ optional: true })) organizationId?: string,
    @Query('categoryId', new ParseUUIDPipe({ optional: true })) categoryId?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
  ): Promise<PageResponse<SupplyResponseDto>> {
    const supplies = await this.suppliesService.findPage(
      { organizationId, categoryId, isActive },
      page,
    );
    return toPageResponse(supplies, (supply) => SupplyResponseDto.fromDomain(supply));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un insumo maestro' })
  @ApiOkResponse({ type: SupplyResponseDto })
  @ApiNotFoundResponse({ description: 'Insumo no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<SupplyResponseDto> {
    return SupplyResponseDto.fromDomain(await this.suppliesService.findOne(id));
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar un insumo maestro',
    description: 'La unidad base solo cambia si ninguna sede registró movimientos (422)',
  })
  @ApiOkResponse({ type: SupplyResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplyDto,
  ): Promise<SupplyResponseDto> {
    return SupplyResponseDto.fromDomain(await this.suppliesService.update(id, dto));
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar un insumo maestro (baja lógica)',
    description: 'Las sedes conservan su historial; ya no se puede habilitar en nuevas sedes',
  })
  @ApiOkResponse({ description: 'Id del registro desactivado' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.suppliesService.deactivate(id);
    return { id };
  }
}
