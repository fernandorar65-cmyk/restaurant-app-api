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
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { Role } from './entities/role.entity.js';
import { RolesService } from './roles.service.js';

@ApiTags('iam/roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un rol' })
  @ApiCreatedResponse({ type: Role })
  create(@Body() dto: CreateRoleDto): Promise<Role> {
    return this.rolesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar roles' })
  @ApiOkResponse({ type: [Role] })
  findAll(): Promise<Role[]> {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un rol por id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: Role })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  findOne(@Param('id') id: string): Promise<Role> {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un rol' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ type: Role })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto): Promise<Role> {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un rol' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Id del rol eliminado' })
  @ApiNotFoundResponse({ description: 'Rol no encontrado' })
  async remove(@Param('id') id: string): Promise<{ id: string }> {
    await this.rolesService.remove(id);
    return { id };
  }
}
