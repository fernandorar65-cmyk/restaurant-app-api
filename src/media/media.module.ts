import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrganizationsModule } from '../organizations/organizations.module.js';
import { ImageUploadsService } from './application/images/image-uploads.service.js';
import { FILE_STORAGE } from './application/ports/file-storage.port.js';
import type { FileStoragePort } from './application/ports/file-storage.port.js';
import { UploadsController } from './infrastructure/http/controllers/uploads.controller.js';
import { AzureBlobFileStorageAdapter } from './infrastructure/storage/azure-blob-file-storage.adapter.js';
import { S3FileStorageAdapter } from './infrastructure/storage/s3-file-storage.adapter.js';
import { UnconfiguredFileStorageAdapter } from './infrastructure/storage/unconfigured-file-storage.adapter.js';

/**
 * Uploaded files. STORAGE_PROVIDER picks the adapter (aws | azure); left
 * empty, uploads answer 503 until credentials are set.
 */
@Module({
  imports: [OrganizationsModule],
  controllers: [UploadsController],
  providers: [
    ImageUploadsService,
    {
      provide: FILE_STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): FileStoragePort => {
        switch (config.get<string>('STORAGE_PROVIDER')) {
          case 'aws':
            return new S3FileStorageAdapter(config);
          case 'azure':
            return new AzureBlobFileStorageAdapter(config);
          default:
            return new UnconfiguredFileStorageAdapter();
        }
      },
    },
  ],
})
export class MediaModule {}
