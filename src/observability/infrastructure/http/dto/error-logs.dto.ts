import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ErrorLog, ErrorLogLevel } from '../../../domain/entities/error-log.entity.js';

export class ErrorLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['error', 'fatal'] })
  level: ErrorLogLevel;

  @ApiPropertyOptional({ nullable: true, example: 'HttpExceptionFilter' })
  source: string | null;

  @ApiProperty({ example: 'POST /products → INTERNAL_ERROR' })
  message: string;

  @ApiPropertyOptional({ nullable: true })
  stack: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Mismo valor que el header X-Request-Id de la respuesta',
  })
  requestId: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'POST' })
  method: string | null;

  @ApiPropertyOptional({ nullable: true, example: '/products' })
  path: string | null;

  @ApiPropertyOptional({ nullable: true, example: 500 })
  statusCode: number | null;

  @ApiPropertyOptional({ nullable: true, example: 'INTERNAL_ERROR' })
  errorCode: string | null;

  @ApiPropertyOptional({ nullable: true })
  userId: string | null;

  @ApiProperty()
  createdAt: Date;

  static fromDomain(errorLog: ErrorLog): ErrorLogResponseDto {
    const dto = new ErrorLogResponseDto();
    dto.id = errorLog.id;
    dto.level = errorLog.level;
    dto.source = errorLog.source;
    dto.message = errorLog.message;
    dto.stack = errorLog.stack;
    dto.requestId = errorLog.requestId;
    dto.method = errorLog.method;
    dto.path = errorLog.path;
    dto.statusCode = errorLog.statusCode;
    dto.errorCode = errorLog.errorCode;
    dto.userId = errorLog.userId;
    dto.createdAt = errorLog.createdAt;
    return dto;
  }
}
