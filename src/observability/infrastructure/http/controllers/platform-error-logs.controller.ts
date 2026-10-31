import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { PageRequest } from '../../../../common/application/pagination.js';
import {
  ApiPaginatedResponse,
  Pagination,
  toPageResponse,
  type PageResponse,
} from '../../../../common/infrastructure/http/pagination.js';
import { ParseBusinessDatePipe } from '../../../../common/infrastructure/http/parse-business-date.pipe.js';
import { PlatformAdmin } from '../../../../common/infrastructure/http/platform-admin.decorator.js';
import { ErrorLogsService } from '../../../application/error-logs/error-logs.service.js';
import type { ErrorLogLevel } from '../../../domain/entities/error-log.entity.js';
import { ErrorLogResponseDto } from '../dto/error-logs.dto.js';

const LEVELS: Record<ErrorLogLevel, ErrorLogLevel> = { error: 'error', fatal: 'fatal' };

/**
 * Private ACMR API (platform administrators only): errors the application
 * logged, to diagnose a failure reported with its request id.
 */
@ApiTags('platform/error-logs')
@ApiForbiddenResponse({ description: 'Solo administradores de ACMR' })
@PlatformAdmin()
@Controller('platform/error-logs')
export class PlatformErrorLogsController {
  constructor(private readonly errorLogsService: ErrorLogsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar errores registrados (más recientes primero)' })
  @ApiQuery({ name: 'level', required: false, enum: ['error', 'fatal'] })
  @ApiQuery({ name: 'requestId', required: false, description: 'Header X-Request-Id' })
  @ApiQuery({ name: 'errorCode', required: false, example: 'INTERNAL_ERROR' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'from', required: false, example: '2026-10-01', description: 'UTC' })
  @ApiQuery({ name: 'to', required: false, example: '2026-10-31', description: 'UTC' })
  @ApiPaginatedResponse(ErrorLogResponseDto)
  async findAll(
    @Pagination() page: PageRequest,
    @Query('level', new ParseEnumPipe(LEVELS, { optional: true })) level?: ErrorLogLevel,
    @Query('requestId') requestId?: string,
    @Query('errorCode') errorCode?: string,
    @Query('userId', new ParseUUIDPipe({ optional: true })) userId?: string,
    @Query('from', new ParseBusinessDatePipe({ optional: true })) from?: string,
    @Query('to', new ParseBusinessDatePipe({ optional: true })) to?: string,
  ): Promise<PageResponse<ErrorLogResponseDto>> {
    const errorLogs = await this.errorLogsService.findPage(
      { level, requestId, errorCode, userId, from, to },
      page,
    );
    return toPageResponse(errorLogs, (errorLog) => ErrorLogResponseDto.fromDomain(errorLog));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un error con su stack trace' })
  @ApiOkResponse({ type: ErrorLogResponseDto })
  @ApiNotFoundResponse({ description: 'Registro no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ErrorLogResponseDto> {
    return ErrorLogResponseDto.fromDomain(await this.errorLogsService.findOne(id));
  }
}
