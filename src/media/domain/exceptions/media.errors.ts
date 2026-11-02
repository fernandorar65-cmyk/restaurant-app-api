import {
  NotFoundDomainError,
  UnavailableDomainError,
  ValidationDomainError,
} from '../../../common/domain/domain-error.js';

export class UnsupportedImageTypeError extends ValidationDomainError {
  constructor(contentType: string, allowed: readonly string[]) {
    super(
      `Tipo de imagen no permitido (${contentType}); usa ${allowed.join(', ')}`,
    );
  }
}

export class ImageTooLargeError extends ValidationDomainError {
  constructor(maxBytes: number) {
    super(
      `La imagen supera el máximo de ${Math.round(maxBytes / 1024 / 1024)} MB`,
    );
  }
}

export class EmptyImageError extends ValidationDomainError {
  constructor() {
    super('Envía la imagen en el campo "file"');
  }
}

export class FileStorageNotConfiguredError extends UnavailableDomainError {
  constructor() {
    super('La subida de archivos no está configurada en este entorno');
  }
}

export class RestaurantReferenceNotFoundError extends NotFoundDomainError {
  constructor(id: string) {
    super(`No existe el restaurante con id "${id}"`);
  }
}
