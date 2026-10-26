import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { BusinessDate } from '../../domain/value-objects/business-date.js';
import { ValidationDomainError } from '../../domain/domain-error.js';

/** Validates an optional 'YYYY-MM-DD' query/path parameter. */
@Injectable()
export class ParseBusinessDatePipe implements PipeTransform<string | undefined> {
  constructor(private readonly options: { optional?: boolean } = {}) {}

  transform(value: string | undefined): string | undefined {
    if (value === undefined || value === '') {
      if (this.options.optional) {
        return undefined;
      }
      throw new BadRequestException({
        message: 'La fecha es obligatoria (YYYY-MM-DD)',
        errorCode: 'VALIDATION_ERROR',
      });
    }
    try {
      return BusinessDate.create(value).value;
    } catch (error) {
      if (error instanceof ValidationDomainError) {
        throw new BadRequestException({
          message: error.message,
          errorCode: 'VALIDATION_ERROR',
        });
      }
      throw error;
    }
  }
}
