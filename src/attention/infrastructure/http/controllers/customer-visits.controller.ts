import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AttentionQueriesService } from '../../../application/attentions/attention-queries.service.js';
import { AttentionVisitResponseDto } from '../dto/attention-responses.dto.js';
import type { PageRequest } from '../../../../common/domain/pagination.js';
import { Authenticated } from '../../../../common/infrastructure/http/access/authorize.decorator.js';
import { CurrentUser } from '../../../../common/infrastructure/http/current-user.decorator.js';
import type { RequestUser } from '../../../../common/infrastructure/http/current-user.decorator.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';

@ApiTags('customer/me')
@ApiBearerAuth()
@Controller('api/v1/customer/me/attentions')
export class CustomerVisitsController {
  constructor(private readonly attentions: AttentionQueriesService) {}

  @Authenticated()
  @Get()
  @ApiOperation({
    summary: 'Mis visitas',
    description:
      'Atenciones en las que participó el comensal con sesión (las de invitado no se ligan a la cuenta), de la más reciente a la más antigua, con la sede, los productos cobrables, el total y el saldo',
  })
  @ApiPaginatedResponse(AttentionVisitResponseDto)
  async findMine(
    @CurrentUser() current: RequestUser,
    @Pagination() page: PageRequest,
  ): Promise<PageResponse<AttentionVisitResponseDto>> {
    const visits = await this.attentions.findVisitsOfUser(current.id, page);
    return toPageResponse(visits, (visit) =>
      AttentionVisitResponseDto.fromVisit(visit),
    );
  }
}
