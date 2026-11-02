export const STORAGE_PROVIDERS = ['aws', 'azure'] as const;
export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];

/** Variables each provider needs; checked at startup when it is selected. */
export const REQUIRED_STORAGE_VARIABLES: Record<StorageProvider, string[]> = {
  aws: ['AWS_S3_BUCKET', 'AWS_S3_REGION'],
  azure: ['AZURE_STORAGE_CONNECTION_STRING', 'AZURE_STORAGE_CONTAINER'],
};

/** Public URL of a stored key: the CDN / custom domain when there is one. */
export function publicUrl(baseUrl: string, key: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${key}`;
}
