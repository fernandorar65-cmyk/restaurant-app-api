import {
  Body,
  Controller,
  Delete,
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
import { MembershipsService } from '../../../application/memberships/memberships.service.js';
import { CreateMembershipDto } from '../dto/memberships/create-membership.dto.js';
import { MembershipResponseDto } from '../dto/memberships/membership-response.dto.js';
import { UpdateMembershipDto } from '../dto/memberships/update-membership.dto.js';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

@ApiTags('iam/memberships')
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  @ApiOperation({ summary: 'Vincular un usuario a una organización con un rol y sedes' })
  @ApiCreatedResponse({ type: MembershipResponseDto })
  async create(@Body() dto: CreateMembershipDto): Promise<MembershipResponseDto> {
    const membership = await this.membershipsService.create(dto);
    return MembershipResponseDto.fromDomain(membership);
  }

  @Get()
  @ApiOperation({ summary: 'Listar membresías' })
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiPaginatedResponse(MembershipResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('organizationId', new ParseUUIDPipe({ optional: true }))
    organizationId?: string,
    @Query('userId', new ParseUUIDPipe({ optional: true })) userId?: string,
  ): Promise<PageResponse<MembershipResponseDto>> {
    const memberships = await this.membershipsService.findPage({
      organizationId,
      userId,
    }, page);
    return toPageResponse(memberships, (membership) =>
      MembershipResponseDto.fromDomain(membership),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una membresía por id' })
  @ApiOkResponse({ type: MembershipResponseDto })
  @ApiNotFoundResponse({ description: 'Membresía no encontrada' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MembershipResponseDto> {
    const membership = await this.membershipsService.findOne(id);
    return MembershipResponseDto.fromDomain(membership);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cambiar rol, sedes o estado de una membresía' })
  @ApiOkResponse({ type: MembershipResponseDto })
  @ApiNotFoundResponse({ description: 'Membresía no encontrada' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMembershipDto,
  ): Promise<MembershipResponseDto> {
    const membership = await this.membershipsService.update(id, dto);
    return MembershipResponseDto.fromDomain(membership);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Desactivar una membresía (baja lógica)',
    description: 'No se borra: queda inactivo para conservar el historial',
  })
  @ApiOkResponse({ description: 'Id del registro desactivado' })
  @ApiNotFoundResponse({ description: 'Membresía no encontrada' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.membershipsService.deactivate(id);
    return { id };
  }
}
