import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { MenuProduct } from '../../../../domain/entities/menu-product.entity.js';

export class AddMenuProductDto {
  @ApiProperty({ example: '7c1e6f2a-2222-4b3a-9a1a-9f3b2c1d4e5f' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ type: String,
    description: 'Sección del mismo menú (null = sin sección)',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  menuSectionId?: string | null;

  @ApiPropertyOptional({ type: Number,
    example: 29.9,
    description: 'Precio a mostrar en este menú (el pedido usa el precio del producto)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  displayPrice?: number | null;

  @ApiPropertyOptional({
    description: 'Orden dentro de su sección (menor primero)', default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'false = oculto en la carta sin quitarlo del menú', default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

export class UpdateMenuProductDto extends OmitType(AddMenuProductDto, [
  'productId',
] as const) {}

export class MenuProductResponseDto {
  @ApiProperty()
  menuId: string;

  @ApiProperty()
  productId: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  menuSectionId: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  displayPrice: number | null;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isVisible: boolean;

  @ApiProperty()
  createdAt: Date;

  static fromDomain(menuProduct: MenuProduct): MenuProductResponseDto {
    const dto = new MenuProductResponseDto();
    dto.menuId = menuProduct.menuId;
    dto.productId = menuProduct.productId;
    dto.menuSectionId = menuProduct.menuSectionId;
    dto.displayPrice = menuProduct.displayPrice;
    dto.sortOrder = menuProduct.sortOrder;
    dto.isVisible = menuProduct.isVisible;
    dto.createdAt = menuProduct.createdAt;
    return dto;
  }
}

export class ReorderMenuSectionsDto {
  @ApiProperty({
    type: [String],
    description: 'Todas las secciones del menú (incluidas las ocultas) en el nuevo orden',
  })
  @IsArray()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  ids: string[];
}

export class ReorderMenuProductsDto {
  @ApiPropertyOptional({ type: String,
    nullable: true,
    description: 'Sección cuyos productos se ordenan; null u omitido = los productos sin sección',
  })
  @IsOptional()
  @IsUUID()
  menuSectionId?: string | null;

  @ApiProperty({
    type: [String],
    description: 'Todos los productos de esa sección en el nuevo orden',
  })
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID('all', { each: true })
  productIds: string[];
}
