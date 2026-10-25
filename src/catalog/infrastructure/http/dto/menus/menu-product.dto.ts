import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { MenuProduct } from '../../../../domain/entities/menu-product.entity.js';

export class AddMenuProductDto {
  @ApiProperty({ example: '7c1e6f2a-2222-4b3a-9a1a-9f3b2c1d4e5f' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({
    example: 29.9,
    description: 'Precio a mostrar en este menú (el pedido usa el precio del producto)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  displayPrice?: number | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
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

  @ApiPropertyOptional({ nullable: true })
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
    dto.displayPrice = menuProduct.displayPrice;
    dto.sortOrder = menuProduct.sortOrder;
    dto.isVisible = menuProduct.isVisible;
    dto.createdAt = menuProduct.createdAt;
    return dto;
  }
}
