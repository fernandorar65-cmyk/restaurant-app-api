import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { ConfigService } from '@nestjs/config';
import type {
  FileStoragePort,
  StoredFile,
} from '../../application/ports/file-storage.port.js';
import { publicUrl } from '../../../common/infrastructure/config/storage-config.js';

/**
 * Amazon S3, or any S3-compatible storage (Cloudflare R2, MinIO) through
 * AWS_S3_ENDPOINT. Without AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY the SDK
 * uses its default credential chain (IAM role, ~/.aws...).
 */
export class S3FileStorageAdapter implements FileStoragePort {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    const region = config.getOrThrow<string>('AWS_S3_REGION');
    const endpoint = config.get<string>('AWS_S3_ENDPOINT');
    const accessKeyId = config.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = config.get<string>('AWS_SECRET_ACCESS_KEY');
    this.bucket = config.getOrThrow<string>('AWS_S3_BUCKET');
    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: Boolean(endpoint),
      credentials:
        accessKeyId && secretAccessKey
          ? { accessKeyId, secretAccessKey }
          : undefined,
    });
    this.baseUrl =
      config.get<string>('AWS_S3_PUBLIC_BASE_URL') ||
      (endpoint
        ? `${endpoint.replace(/\/+$/, '')}/${this.bucket}`
        : `https://${this.bucket}.s3.${region}.amazonaws.com`);
  }

  async upload(file: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredFile> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: file.key,
        Body: file.body,
        ContentType: file.contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return { key: file.key, url: publicUrl(this.baseUrl, file.key) };
  }
}
