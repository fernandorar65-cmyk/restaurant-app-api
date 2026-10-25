import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
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

  @ApiProperty({ type: [CartValidationLineDto] })
  lines: CartValidationLineDto[];

  @ApiProperty()
  total: number;

  static fromResult(result: CartValidationResult): CartValidateResponseDto {
    return Object.assign(new CartValidateResponseDto(), result);
  }
}
