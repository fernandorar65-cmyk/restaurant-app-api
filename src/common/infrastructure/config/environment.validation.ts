const REQUIRED_SECRETS = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;

/** Values published in .env.example; never acceptable outside local dev. */
const EXAMPLE_SECRETS = new Set(['dev-access-secret', 'dev-refresh-secret']);

const MIN_PRODUCTION_SECRET_LENGTH = 32;

const LOG_LEVELS = ['fatal', 'error', 'warn', 'log', 'debug', 'verbose'];
const LOG_FORMATS = ['text', 'json'];

/**
 * Runs once at startup (ConfigModule `validate`): the app refuses to boot
 * without its JWT secrets instead of silently signing tokens with a default.
 */
export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const isProduction = config.NODE_ENV === 'production';
  const errors: string[] = [];

  for (const key of REQUIRED_SECRETS) {
    const value = config[key];
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`${key} es obligatorio`);
      continue;
    }
    if (isProduction && EXAMPLE_SECRETS.has(value)) {
      errors.push(`${key} no puede usar el valor de ejemplo en producción`);
    }
    if (isProduction && value.length < MIN_PRODUCTION_SECRET_LENGTH) {
      errors.push(
        `${key} debe tener al menos ${MIN_PRODUCTION_SECRET_LENGTH} caracteres en producción`,
      );
    }
  }
  if (
    config.JWT_ACCESS_SECRET &&
    config.JWT_ACCESS_SECRET === config.JWT_REFRESH_SECRET
  ) {
    errors.push('JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben ser distintos');
  }

  if (config.LOG_LEVEL !== undefined && !LOG_LEVELS.includes(config.LOG_LEVEL as string)) {
    errors.push(`LOG_LEVEL debe ser uno de: ${LOG_LEVELS.join(', ')}`);
  }
  if (config.LOG_FORMAT !== undefined && !LOG_FORMATS.includes(config.LOG_FORMAT as string)) {
    errors.push(`LOG_FORMAT debe ser uno de: ${LOG_FORMATS.join(', ')}`);
  }

  const retentionDays = config.ERROR_LOG_RETENTION_DAYS;
  if (
    retentionDays !== undefined &&
    !(Number.isInteger(Number(retentionDays)) && Number(retentionDays) >= 1)
  ) {
    errors.push('ERROR_LOG_RETENTION_DAYS debe ser un entero mayor o igual a 1');
  }

  if (errors.length > 0) {
    throw new Error(`Configuración inválida:\n- ${errors.join('\n- ')}`);
  }
  return config;
}
