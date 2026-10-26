import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CartValidationService } from '../../../application/cart-validation/cart-validation.service.js';
import { CartValidateResponseDto } from '../dto/cart/cart-validate-response.dto.js';
import { CartValidateDto } from '../dto/cart/cart-validate.dto.js';
import { Public } from '../../../../common/infrastructure/http/public.decorator.js';

@ApiTags('customer/cart')
@Public()
@Controller('api/v1/restaurants')
export class CartValidationController {
  constructor(private readonly cartValidationService: CartValidationService) {}

  @Post(':slug/cart/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Valida disponibilidad, modalidad y precios vigentes del servidor',
  })
  @ApiOkResponse({ type: CartValidateResponseDto })
  async validate(
    @Param('slug') slug: string,
    @Body() dto: CartValidateDto,
  ): Promise<CartValidateResponseDto> {
    const result = await this.cartValidationService.validateBySlug(slug, dto);
    return CartValidateResponseDto.fromResult(result);
  }
}
