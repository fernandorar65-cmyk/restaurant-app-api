import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CartServiceIssue,
  CartValidationIssueCode,
  CartValidationResult,
} from '../../../../application/cart-validation/cart-validation.service.js';

class CartValidationIssueDto {
  @ApiProperty()
  productId: string;

  @ApiProperty({
    enum: [
      'PRODUCT_NOT_FOUND',
      'PRODUCT_NOT_IN_RESTAURANT',
      'PRODUCT_INACTIVE',
      'PRODUCT_UNAVAILABLE',
      'MODE_NOT_ALLOWED',
      'PRICE_CHANGED',
    ],
  })
  code: CartValidationIssueCode;

  @ApiPropertyOptional()
  currentPrice?: number;
}

class CartValidationLineDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ description: 'Precio vigente del servidor' })
  unitPrice: number;

  @ApiProperty()
  subtotal: number;
}

export class CartValidateResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiProperty({ type: [CartValidationIssueDto] })
  issues: CartValidationIssueDto[];

  @ApiProperty({
    enum: ['MODE_DISABLED', 'BELOW_MINIMUM'],
    isArray: true,
    description: 'Problemas del pedido completo según la modalidad de la sede',
  })
  serviceIssues: CartServiceIssue[];

  @ApiProperty({ type: [CartValidationLineDto] })
  lines: CartValidationLineDto[];

  @ApiProperty()
  subtotal: number;

  @ApiPropertyOptional({ nullable: true })
  minimumAmount: number | null;

  @ApiProperty({ description: 'Solo en DELIVERY' })
  deliveryFee: number;

  @ApiProperty({ description: 'subtotal + deliveryFee' })
  total: number;

  static fromResult(result: CartValidationResult): CartValidateResponseDto {
    return Object.assign(new CartValidateResponseDto(), result);
  }
}
