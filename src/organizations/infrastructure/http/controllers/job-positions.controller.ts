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
import { JobPositionsService } from '../../../application/job-positions/job-positions.service.js';
import {
  CreateJobPositionDto,
  JobPositionResponseDto,
  UpdateJobPositionDto,
} from '../dto/work-structure/work-structure.dto.js';

/** Job positions (Cocinero, Mozo...). They describe the job; IAM roles grant access. */
@ApiTags('organizations/job-positions')
@Controller('job-positions')
export class JobPositionsController {
  constructor(private readonly jobPositionsService: JobPositionsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un puesto dentro de un área' })
  @ApiCreatedResponse({ type: JobPositionResponseDto })
  async create(@Body() dto: CreateJobPositionDto): Promise<JobPositionResponseDto> {
    return JobPositionResponseDto.fromDomain(await this.jobPositionsService.create(dto));
  }

  @Get()
  @ApiOperation({ summary: 'Listar puestos' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'workAreaId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiPaginatedResponse(JobPositionResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('organizationId', new ParseUUIDPipe({ optional: true }))
    organizationId?: string,
    @Query('workAreaId', new ParseUUIDPipe({ optional: true })) workAreaId?: string,
    @Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean,
  ): Promise<PageResponse<JobPositionResponseDto>> {
    const positions = await this.jobPositionsService.findPage(
      { organizationId, workAreaId, isActive },
      page,
    );
    return toPageResponse(positions, (position) => JobPositionResponseDto.fromDomain(position));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un puesto' })
  @ApiOkResponse({ type: JobPositionResponseDto })
  @ApiNotFoundResponse({ description: 'Puesto no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<JobPositionResponseDto> {
    return JobPositionResponseDto.fromDomain(await this.jobPositionsService.findOne(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar, mover de área, activar o desactivar un puesto' })
  @ApiOkResponse({ type: JobPositionResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobPositionDto,
  ): Promise<JobPositionResponseDto> {
    return JobPositionResponseDto.fromDomain(
      await this.jobPositionsService.update(id, dto),
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar un puesto (baja lógica)',
    description:
      'No se borra ni afecta a los empleados que ya lo tienen; solo deja de poder asignarse',
  })
  @ApiOkResponse({ description: 'Id del registro desactivado' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.jobPositionsService.deactivate(id);
    return { id };
  }
}
