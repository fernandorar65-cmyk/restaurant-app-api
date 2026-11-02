import type {
  FileStoragePort,
  StoredFile,
} from '../../application/ports/file-storage.port.js';
import { FileStorageNotConfiguredError } from '../../domain/exceptions/media.errors.js';

/** Used while STORAGE_PROVIDER is empty: uploads answer 503 instead of failing at startup. */
export class UnconfiguredFileStorageAdapter implements FileStoragePort {
  upload(): Promise<StoredFile> {
    return Promise.reject(new FileStorageNotConfiguredError());
  }
}
