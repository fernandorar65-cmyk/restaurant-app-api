import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TENANT_LOOKUP } from '../../../common/application/ports/tenant-lookup.port.js';
import type { TenantLookup } from '../../../common/application/ports/tenant-lookup.port.js';
import { RestaurantReferenceNotFoundError } from '../../domain/exceptions/media.errors.js';
import { planImageUpload } from '../../domain/image-upload.js';
import { FILE_STORAGE } from '../ports/file-storage.port.js';
import type {
  FileStoragePort,
  StoredFile,
} from '../ports/file-storage.port.js';

/**
 * Images of a restaurant (products, menu). The client uploads the file here
 * and saves the returned URL in the record (e.g. imageUrl of a product).
 */
@Injectable()
export class ImageUploadsService {
  constructor(
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
    @Inject(TENANT_LOOKUP) private readonly restaurants: TenantLookup,
  ) {}

  async upload(
    restaurantId: string,
    file: { body: Buffer; contentType: string },
  ): Promise<StoredFile> {
    if (!(await this.restaurants.findRestaurant(restaurantId))) {
      throw new RestaurantReferenceNotFoundError(restaurantId);
    }
    const plan = planImageUpload({
      restaurantId,
      contentType: file.contentType,
      size: file.body.length,
      id: randomUUID(),
    });
    return this.storage.upload({ ...plan, body: file.body });
  }
}
