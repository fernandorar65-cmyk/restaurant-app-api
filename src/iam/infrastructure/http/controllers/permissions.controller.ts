import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionsService } from '../../../application/permissions/permissions.service.js';
import { CreatePermissionDto } from '../dto/permissions/create-permission.dto.js';
import { PermissionResponseDto } from '../dto/permissions/permission-response.dto.js';
import { UpdatePermissionDto } from '../dto/permissions/update-permission.dto.js';

@ApiTags('iam/permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un permiso' })
  @ApiCreatedResponse({ type: PermissionResponseDto })
  async create(@Body() dto: CreatePermissionDto): Promise<PermissionResponseDto> {
    const permission = await this.permissionsService.create(dto);
    return PermissionResponseDto.fromDomain(permission);
  }

  @Get()
  @ApiOperation({ summary: 'Listar permisos' })
  @ApiOkResponse({ type: [PermissionResponseDto] })
  async findAll(): Promise<PermissionResponseDto[]> {
    const permissions = await this.permissionsService.findAll();
    return permissions.map(PermissionResponseDto.fromDomain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un permiso por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: PermissionResponseDto })
  @ApiNotFoundResponse({ description: 'Permiso no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PermissionResponseDto> {
    const permission = await this.permissionsService.findOne(id);
    return PermissionResponseDto.fromDomain(permission);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un permiso' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: PermissionResponseDto })
  @ApiNotFoundResponse({ description: 'Permiso no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    const permission = await this.permissionsService.update(id, dto);
    return PermissionResponseDto.fromDomain(permission);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un permiso' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id del permiso eliminado' })
  @ApiNotFoundResponse({ description: 'Permiso no encontrado' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.permissionsService.remove(id);
    return { id };
  }
}
