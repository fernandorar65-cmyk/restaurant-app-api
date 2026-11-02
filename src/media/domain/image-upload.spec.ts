import {
  EmptyImageError,
  ImageTooLargeError,
  UnsupportedImageTypeError,
} from './exceptions/media.errors.js';
import { IMAGE_MAX_BYTES, planImageUpload } from './image-upload.js';

const upload = (contentType: string, size = 1000) =>
  planImageUpload({ restaurantId: 'r1', contentType, size, id: 'img-1' });

describe('planImageUpload', () => {
  it('stores the image in the restaurant folder with a random name', () => {
    expect(upload('image/png')).toEqual({
      key: 'restaurants/r1/images/img-1.png',
      contentType: 'image/png',
    });
    expect(upload('image/jpeg').key).toBe('restaurants/r1/images/img-1.jpg');
  });

  it.each(['image/svg+xml', 'application/pdf', 'text/html'])(
    'rejects %s',
    (contentType) => {
      expect(() => upload(contentType)).toThrow(UnsupportedImageTypeError);
    },
  );

  it('rejects empty and too large files', () => {
    expect(() => upload('image/png', 0)).toThrow(EmptyImageError);
    expect(() => upload('image/png', IMAGE_MAX_BYTES + 1)).toThrow(
      ImageTooLargeError,
    );
    expect(upload('image/png', IMAGE_MAX_BYTES).key).toContain('img-1');
  });
});
