import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlatformAdmin } from '../../../../common/infrastructure/http/platform-admin.decorator.js';
import { InventoryCatalogService } from '../../../application/inventory-catalog/inventory-catalog.service.js';
import {
  MovementTypeResponseDto,
  RenameMovementTypeDto,
  UnitOfMeasureResponseDto,
  UpdateUnitOfMeasureDto,
} from '../dto/inventory-catalog.dto.js';

/** Read access to the ACMR inventory catalogs (to fill forms). */
@ApiTags('inventory/catalog')
@Controller()
export class InventoryCatalogController {
  constructor(private readonly catalogService: InventoryCatalogService) {}

  @Get('units-of-measure')
  @ApiOperation({ summary: 'Unidades de medida del catálogo de ACMR' })
  @ApiOkResponse({ type: [UnitOfMeasureResponseDto] })
  async listUnits(): Promise<UnitOfMeasureResponseDto[]> {
    return (await this.catalogService.listUnits()).map((unit) => UnitOfMeasureResponseDto.from(unit));
  }

  @Get('inventory-movement-types')
  @ApiOperation({ summary: 'Tipos de movimiento y su efecto sobre el stock' })
  @ApiOkResponse({ type: [MovementTypeResponseDto] })
  async listMovementTypes(): Promise<MovementTypeResponseDto[]> {
    return (await this.catalogService.listMovementTypes()).map((type) =>
      MovementTypeResponseDto.from(type),
    );
  }
}

/** Private ACMR maintenance of the inventory catalogs (platform administrators only). */
@ApiTags('platform/inventory')
@ApiForbiddenResponse({ description: 'Solo administradores de ACMR' })
@PlatformAdmin()
@Controller('platform')
export class PlatformInventoryController {
  constructor(private readonly catalogService: InventoryCatalogService) {}

  @Patch('units-of-measure/:code')
  @ApiOperation({
    summary: 'Renombrar o activar/desactivar una unidad',
    description: 'La dimensión y el factor de conversión no se pueden cambiar',
  })
  @ApiOkResponse({ type: UnitOfMeasureResponseDto })
  async updateUnit(
    @Param('code') code: string,
    @Body() dto: UpdateUnitOfMeasureDto,
  ): Promise<UnitOfMeasureResponseDto> {
    return UnitOfMeasureResponseDto.from(await this.catalogService.updateUnit(code, dto));
  }

  @Patch('inventory-movement-types/:code')
  @ApiOperation({
    summary: 'Renombrar un tipo de movimiento',
    description: 'El efecto sobre el stock no se puede cambiar',
  })
  @ApiOkResponse({ type: MovementTypeResponseDto })
  async renameMovementType(
    @Param('code') code: string,
    @Body() dto: RenameMovementTypeDto,
  ): Promise<MovementTypeResponseDto> {
    return MovementTypeResponseDto.from(
      await this.catalogService.renameMovementType(code, dto.name),
    );
  }
}
