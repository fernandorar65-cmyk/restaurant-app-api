export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface StoredFile {
  key: string;
  /** Public URL to save in the record (e.g. products.image_url). */
  url: string;
}

/** Where uploaded files live (S3, Azure Blob...). Chosen by STORAGE_PROVIDER. */
export interface FileStoragePort {
  upload(file: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredFile>;
}
