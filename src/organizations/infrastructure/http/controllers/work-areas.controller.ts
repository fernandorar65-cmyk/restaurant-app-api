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
import { WorkAreasService } from '../../../application/work-areas/work-areas.service.js';
import {
  CreateWorkAreaDto,
  UpdateWorkAreaDto,
  WorkAreaResponseDto,
} from '../dto/work-structure/work-structure.dto.js';

/** Work areas of an organization (Cocina, Sala...). They never grant permissions. */
@ApiTags('organizations/work-areas')
@Controller('work-areas')
export class WorkAreasController {
  constructor(private readonly workAreasService: WorkAreasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un área laboral' })
  @ApiCreatedResponse({ type: WorkAreaResponseDto })
  async create(@Body() dto: CreateWorkAreaDto): Promise<WorkAreaResponseDto> {
    return WorkAreaResponseDto.fromDomain(await this.workAreasService.create(dto));
  }

  @Get()
  @ApiOperation({ summary: 'Listar áreas laborales' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiPaginatedResponse(WorkAreaResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('organizationId', new ParseUUIDPipe({ optional: true }))
    organizationId?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
  ): Promise<PageResponse<WorkAreaResponseDto>> {
    const workAreas = await this.workAreasService.findPage(
      { organizationId, isActive },
      page,
    );
    return toPageResponse(workAreas, (workArea) => WorkAreaResponseDto.fromDomain(workArea));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un área laboral' })
  @ApiOkResponse({ type: WorkAreaResponseDto })
  @ApiNotFoundResponse({ description: 'Área no encontrada' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<WorkAreaResponseDto> {
    return WorkAreaResponseDto.fromDomain(await this.workAreasService.findOne(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar, activar o desactivar un área laboral' })
  @ApiOkResponse({ type: WorkAreaResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkAreaDto,
  ): Promise<WorkAreaResponseDto> {
    return WorkAreaResponseDto.fromDomain(await this.workAreasService.update(id, dto));
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar un área laboral (baja lógica)',
    description: 'No se borra: puestos y empleados pueden seguir apuntando a ella',
  })
  @ApiOkResponse({ description: 'Id del registro desactivado' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.workAreasService.deactivate(id);
    return { id };
  }
}
