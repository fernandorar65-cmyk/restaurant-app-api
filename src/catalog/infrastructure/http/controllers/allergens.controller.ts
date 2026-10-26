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
  ApiTags,
} from '@nestjs/swagger';
import { AllergensService } from '../../../application/allergens/allergens.service.js';
import {
  AllergenResponseDto,
  CreateAllergenDto,
  RenameAllergenDto,
} from '../dto/composition/composition.dto.js';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

@ApiTags('catalog/allergens')
@Controller('allergens')
export class AllergensController {
  constructor(private readonly allergensService: AllergensService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un alérgeno (catálogo global)' })
  @ApiCreatedResponse({ type: AllergenResponseDto })
  async create(@Body() dto: CreateAllergenDto): Promise<AllergenResponseDto> {
    return AllergenResponseDto.fromDomain(await this.allergensService.create(dto));
  }

  @Get()
  @ApiOperation({ summary: 'Listar alérgenos' })
  @ApiPaginatedResponse(AllergenResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
  ): Promise<PageResponse<AllergenResponseDto>> {
    const allergens = await this.allergensService.findPage(page);
    return toPageResponse(allergens, (allergen) =>
      AllergenResponseDto.fromDomain(allergen),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Renombrar un alérgeno' })
  @ApiOkResponse({ type: AllergenResponseDto })
  @ApiNotFoundResponse({ description: 'Alérgeno no encontrado' })
  async rename(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RenameAllergenDto,
  ): Promise<AllergenResponseDto> {
    return AllergenResponseDto.fromDomain(
      await this.allergensService.rename(id, dto.name),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un alérgeno (lo quita de todos los productos)' })
  @ApiOkResponse({ description: 'Id del alérgeno eliminado' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<{ id: string }> {
    await this.allergensService.remove(id);
    return { id };
  }
}
