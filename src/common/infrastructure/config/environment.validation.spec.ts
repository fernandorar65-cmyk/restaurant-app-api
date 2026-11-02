import { validateEnvironment } from './environment.validation.js';

const base = {
  JWT_ACCESS_SECRET: 'dev-access-secret',
  JWT_REFRESH_SECRET: 'dev-refresh-secret',
};

describe('validateEnvironment: file storage', () => {
  it('accepts no storage provider (uploads disabled)', () => {
    expect(() => validateEnvironment(base)).not.toThrow();
    expect(() =>
      validateEnvironment({ ...base, STORAGE_PROVIDER: '' }),
    ).not.toThrow();
  });

  it('rejects an unknown provider', () => {
    expect(() =>
      validateEnvironment({ ...base, STORAGE_PROVIDER: 'gcp' }),
    ).toThrow(/STORAGE_PROVIDER/);
  });

  it('requires the variables of the chosen provider', () => {
    expect(() =>
      validateEnvironment({ ...base, STORAGE_PROVIDER: 'aws' }),
    ).toThrow(/AWS_S3_BUCKET[\s\S]*AWS_S3_REGION/);
    expect(() =>
      validateEnvironment({
        ...base,
        STORAGE_PROVIDER: 'aws',
        AWS_S3_BUCKET: 'acmr-images',
        AWS_S3_REGION: 'us-east-1',
      }),
    ).not.toThrow();
    expect(() =>
      validateEnvironment({ ...base, STORAGE_PROVIDER: 'azure' }),
    ).toThrow(/AZURE_STORAGE_CONNECTION_STRING/);
  });
});
