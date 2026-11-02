import { BlobServiceClient } from '@azure/storage-blob';
import type { ContainerClient } from '@azure/storage-blob';
import type { ConfigService } from '@nestjs/config';
import type {
  FileStoragePort,
  StoredFile,
} from '../../application/ports/file-storage.port.js';
import { publicUrl } from '../../../common/infrastructure/config/storage-config.js';

/**
 * Azure Blob Storage. The container must allow public read of blobs (or sit
 * behind a CDN set in AZURE_STORAGE_PUBLIC_BASE_URL) for the URLs to open.
 */
export class AzureBlobFileStorageAdapter implements FileStoragePort {
  private readonly container: ContainerClient;
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.container = BlobServiceClient.fromConnectionString(
      config.getOrThrow<string>('AZURE_STORAGE_CONNECTION_STRING'),
    ).getContainerClient(config.getOrThrow<string>('AZURE_STORAGE_CONTAINER'));
    this.baseUrl =
      config.get<string>('AZURE_STORAGE_PUBLIC_BASE_URL') || this.container.url;
  }

  async upload(file: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredFile> {
    await this.container.getBlockBlobClient(file.key).uploadData(file.body, {
      blobHTTPHeaders: {
        blobContentType: file.contentType,
        blobCacheControl: 'public, max-age=31536000, immutable',
      },
    });
    return { key: file.key, url: publicUrl(this.baseUrl, file.key) };
  }
}
