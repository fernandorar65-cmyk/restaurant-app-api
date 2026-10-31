import { ErrorLog } from '../../../../domain/entities/error-log.entity.js';
import { ErrorLogOrmEntity } from '../entities/error-log.orm-entity.js';

export class ErrorLogMapper {
  static toDomain(orm: ErrorLogOrmEntity): ErrorLog {
    return ErrorLog.fromPersistence({
      id: orm.id,
      level: orm.level,
      source: orm.source,
      message: orm.message,
      stack: orm.stack,
      requestId: orm.requestId,
      method: orm.method,
      path: orm.path,
      statusCode: orm.statusCode,
      errorCode: orm.errorCode,
      userId: orm.userId,
      createdAt: orm.createdAt,
    });
  }

  static toPersistence(domain: ErrorLog): ErrorLogOrmEntity {
    const orm = new ErrorLogOrmEntity();
    orm.id = domain.id;
    orm.level = domain.level;
    orm.source = domain.source;
    orm.message = domain.message;
    orm.stack = domain.stack;
    orm.requestId = domain.requestId;
    orm.method = domain.method;
    orm.path = domain.path;
    orm.statusCode = domain.statusCode;
    orm.errorCode = domain.errorCode;
    orm.userId = domain.userId;
    orm.createdAt = domain.createdAt;
    return orm;
  }
}
