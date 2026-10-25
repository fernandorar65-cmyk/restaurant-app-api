import { ApiProperty } from '@nestjs/swagger';
import { Customer } from '../../../../domain/entities/customer.entity.js';
import type { AuthTokens } from '../../../../application/auth/customers-auth.service.js';
import { CustomerResponseDto } from '../customers/customer-response.dto.js';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: CustomerResponseDto })
  customer: CustomerResponseDto;

  static fromDomain(customer: Customer, tokens: AuthTokens): AuthResponseDto {
    const dto = new AuthResponseDto();
    dto.accessToken = tokens.accessToken;
    dto.refreshToken = tokens.refreshToken;
    dto.customer = CustomerResponseDto.fromDomain(customer);
    return dto;
  }
}
