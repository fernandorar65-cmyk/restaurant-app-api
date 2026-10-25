import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CustomerOrderBill } from '../../../../application/customer-orders/customer-orders.service.js';

class CustomerOrderBillItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  paidAmount: number;

  @ApiPropertyOptional({ nullable: true })
  customerId: string | null;
}

export class CustomerOrderBillResponseDto {
  @ApiProperty({ type: [CustomerOrderBillItemDto] })
  items: CustomerOrderBillItemDto[];

  @ApiProperty()
  subtotal: number;

  @ApiProperty()
  discountTotal: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  paid: number;

  @ApiProperty()
  balance: number;

  static fromBill(bill: CustomerOrderBill): CustomerOrderBillResponseDto {
    const dto = new CustomerOrderBillResponseDto();
    dto.items = bill.items;
    dto.subtotal = bill.subtotal;
    dto.discountTotal = bill.discountTotal;
    dto.total = bill.total;
    dto.paid = bill.paid;
    dto.balance = bill.balance;
    return dto;
  }
}
