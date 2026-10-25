import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CartValidationIssue,
  CartValidationIssueCode,
  CartValidationResult,
} from '../../../../application/cart-validation/cart-validation.service.js';

class CartValidationIssueDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  code: CartValidationIssueCode;

  @ApiPropertyOptional()
  currentPrice?: number;
}

export class CartValidateResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiProperty({ type: [CartValidationIssueDto] })
  issues: CartValidationIssue[];

  @ApiProperty()
  total: number;

  static fromResult(result: CartValidationResult): CartValidateResponseDto {
    const dto = new CartValidateResponseDto();
    dto.valid = result.valid;
    dto.issues = result.issues;
    dto.total = result.total;
    return dto;
  }
}
