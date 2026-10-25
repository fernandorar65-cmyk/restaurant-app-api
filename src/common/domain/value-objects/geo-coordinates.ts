import { ValidationDomainError } from '../domain-error.js';

export class GeoCoordinates {
  private constructor(
    readonly latitude: number,
    readonly longitude: number,
  ) {}

  /** Both values must be given together, or neither. */
  static createOptional(
    latitude: number | null | undefined,
    longitude: number | null | undefined,
  ): GeoCoordinates | null {
    if (latitude == null && longitude == null) {
      return null;
    }
    if (latitude == null || longitude == null) {
      throw new ValidationDomainError(
        'La latitud y la longitud deben enviarse juntas',
      );
    }
    if (latitude < -90 || latitude > 90) {
      throw new ValidationDomainError('La latitud debe estar entre -90 y 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new ValidationDomainError(
        'La longitud debe estar entre -180 y 180',
      );
    }
    return new GeoCoordinates(latitude, longitude);
  }
}
