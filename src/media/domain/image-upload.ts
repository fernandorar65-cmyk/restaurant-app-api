import {
  EmptyImageError,
  ImageTooLargeError,
  UnsupportedImageTypeError,
} from './exceptions/media.errors.js';

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
};

export const ALLOWED_IMAGE_TYPES = Object.keys(EXTENSIONS);

/**
 * Where a restaurant's image is stored. The name is random: it never comes
 * from the user, so it can't collide or walk out of the restaurant's folder.
 */
export function planImageUpload(params: {
  restaurantId: string;
  contentType: string;
  size: number;
  id: string;
}): { key: string; contentType: string } {
  if (params.size === 0) {
    throw new EmptyImageError();
  }
  const extension = EXTENSIONS[params.contentType];
  if (!extension) {
    throw new UnsupportedImageTypeError(
      params.contentType,
      ALLOWED_IMAGE_TYPES,
    );
  }
  if (params.size > IMAGE_MAX_BYTES) {
    throw new ImageTooLargeError(IMAGE_MAX_BYTES);
  }
  return {
    key: `restaurants/${params.restaurantId}/images/${params.id}.${extension}`,
    contentType: params.contentType,
  };
}
