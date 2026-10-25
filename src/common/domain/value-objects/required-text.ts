import { ValidationDomainError } from '../domain-error.js';

/**
 * Trims and validates a mandatory text field (names, codes...). Returns the
 * trimmed value so entities store it normalized.
 */
export function requireText(
  value: string,
  field: string,
  options: { min?: number; max?: number } = {},
): string {
  const trimmed = value.trim();
  const min = options.min ?? 1;
  if (trimmed.length < min) {
    throw new ValidationDomainError(
      `${field} debe tener al menos ${min} caracteres`,
    );
  }
  if (options.max !== undefined && trimmed.length > options.max) {
    throw new ValidationDomainError(
      `${field} no puede superar los ${options.max} caracteres`,
    );
  }
  return trimmed;
}
