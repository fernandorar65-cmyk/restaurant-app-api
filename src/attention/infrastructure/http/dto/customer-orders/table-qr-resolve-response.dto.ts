import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class RestaurantSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  name: string;
}

class TableSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  number: string;

  @ApiProperty()
  status: string;
}

class OpenOrderSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  status: string;
}

export class TableQrResolveResponseDto {
  @ApiProperty({ type: RestaurantSummaryDto })
  restaurant: RestaurantSummaryDto;

  @ApiProperty({ type: TableSummaryDto })
  table: TableSummaryDto;

  @ApiPropertyOptional({ type: OpenOrderSummaryDto, nullable: true })
  openOrder: OpenOrderSummaryDto | null;
}
