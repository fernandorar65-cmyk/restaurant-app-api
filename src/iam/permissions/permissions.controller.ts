import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { Permission } from './entities/permission.entity.js';
import { PermissionsService } from './permissions.service.js';

@ApiTags('iam/permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un permiso' })
  @ApiCreatedResponse({ type: Permission })
  create(@Body() dto: CreatePermissionDto): Promise<Permission> {
    return this.permissionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar permisos' })
  @ApiOkResponse({ type: [Permission] })
  findAll(): Promise<Permission[]> {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un permiso por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: Permission })
  @ApiNotFoundResponse({ description: 'Permiso no encontrado' })
  findOne(@Param('id') id: string): Promise<Permission> {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un permiso' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: Permission })
  @ApiNotFoundResponse({ description: 'Permiso no encontrado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ): Promise<Permission> {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un permiso' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id del permiso eliminado' })
  @ApiNotFoundResponse({ description: 'Permiso no encontrado' })
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.permissionsService.remove(id);
    return { id };
  }
}
