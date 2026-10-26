const REQUIRED_SECRETS = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;

/** Values published in .env.example; never acceptable outside local dev. */
const EXAMPLE_SECRETS = new Set(['dev-access-secret', 'dev-refresh-secret']);

const MIN_PRODUCTION_SECRET_LENGTH = 32;

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

  if (errors.length > 0) {
    throw new Error(`Configuración inválida:\n- ${errors.join('\n- ')}`);
  }
  return config;
}
