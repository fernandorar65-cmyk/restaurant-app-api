import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ServiceOffer } from '../../../../application/ports/service-type-lookup.port.js';
import type {
  StorefrontMenu,
  StorefrontProduct,
  StorefrontRestaurant,
} from '../../../../application/storefront/storefront.service.js';
import { MenuSectionResponseDto } from '../categories/category.dto.js';
import { MenuResponseDto } from '../menus/menu-response.dto.js';

export class ServiceOfferResponseDto {
  @ApiProperty({ example: 'DELIVERY' })
  code: string;

  @ApiProperty({ example: 'Delivery' })
  name: string;

  @ApiProperty({ enum: ['DINE_IN', 'PICKUP', 'DELIVERY'] })
  mode: string;

  @ApiProperty({ example: 30, description: '0 = sin mínimo' })
  minimumOrderAmount: number;

  @ApiProperty({ example: 5 })
  deliveryFee: number;

  static from(offer: ServiceOffer): ServiceOfferResponseDto {
    const dto = new ServiceOfferResponseDto();
    dto.code = offer.code;
    dto.name = offer.name;
    dto.mode = offer.mode;
    dto.minimumOrderAmount = offer.minimumOrderAmount;
    dto.deliveryFee = offer.deliveryFee;
    return dto;
  }
}

export class StorefrontRestaurantResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'sabores-miraflores' })
  slug: string;

  @ApiProperty({ example: 'Sabores Miraflores' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  address: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  phone: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  email: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  latitude: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  longitude: number | null;

  @ApiProperty({ example: 'PEN' })
  currencyCode: string;

  @ApiProperty({ example: 'America/Lima' })
  timezone: string;

  @ApiProperty({
    type: [ServiceOfferResponseDto],
    description:
      'Modalidades activas (en mesa, recojo, delivery) con mínimo y costo de envío',
  })
  services: ServiceOfferResponseDto[];

  static from(
    restaurant: StorefrontRestaurant,
  ): StorefrontRestaurantResponseDto {
    const dto = new StorefrontRestaurantResponseDto();
    dto.id = restaurant.id;
    dto.slug = restaurant.slug;
    dto.name = restaurant.name;
    dto.description = restaurant.description;
    dto.address = restaurant.address;
    dto.phone = restaurant.phone;
    dto.email = restaurant.email;
    dto.latitude = restaurant.latitude;
    dto.longitude = restaurant.longitude;
    dto.currencyCode = restaurant.currencyCode;
    dto.timezone = restaurant.timezone;
    dto.services = restaurant.services.map((offer) =>
      ServiceOfferResponseDto.from(offer),
    );
    return dto;
  }
}

export class StorefrontProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'Lomo saltado' })
  name: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  description: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  imageUrl: string | null;

  @ApiProperty({ example: 42, description: 'Precio que se cobra en el pedido' })
  price: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    description: 'Precio de exhibición en este menú (si difiere)',
  })
  displayPrice: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  preparationMinutes: number | null;

  @ApiProperty({ description: 'false = agotado hoy (se muestra igual)' })
  isAvailable: boolean;

  @ApiProperty()
  isTakeawayAllowed: boolean;

  @ApiProperty()
  isDeliveryAllowed: boolean;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Sección del menú; null = sin sección',
  })
  menuSectionId: string | null;

  static from(product: StorefrontProduct): StorefrontProductResponseDto {
    return Object.assign(new StorefrontProductResponseDto(), product);
  }
}

export class StorefrontMenuResponseDto {
  @ApiProperty()
  restaurantId: string;

  @ApiPropertyOptional({
    type: MenuResponseDto,
    nullable: true,
    description: 'Menú vigente; null si la sede no tiene uno',
  })
  menu: MenuResponseDto | null;

  @ApiProperty({
    type: [MenuSectionResponseDto],
    description: 'Secciones activas, en orden',
  })
  sections: MenuSectionResponseDto[];

  @ApiProperty({
    type: [StorefrontProductResponseDto],
    description:
      'Por orden de sección (sin sección al final) y luego orden en el menú',
  })
  products: StorefrontProductResponseDto[];

  static from(menu: StorefrontMenu): StorefrontMenuResponseDto {
    const dto = new StorefrontMenuResponseDto();
    dto.restaurantId = menu.restaurantId;
    dto.menu = menu.menu ? MenuResponseDto.fromDomain(menu.menu) : null;
    dto.sections = menu.sections.map((section) =>
      MenuSectionResponseDto.fromDomain(section),
    );
    dto.products = menu.products.map((product) =>
      StorefrontProductResponseDto.from(product),
    );
    return dto;
  }
}
