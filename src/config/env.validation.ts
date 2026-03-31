import Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Joi's default email validation enforces known TLDs; we disable that to allow internal domains like ".local".
  SEED_SUPER_ADMIN_EMAIL: Joi.string().when('SEED_ENABLED', {
    is: true,
    then: Joi.string()
      .email({ tlds: { allow: false } })
      .required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  SEED_SUPER_ADMIN_PASSWORD: Joi.string().when('SEED_ENABLED', {
    is: true,
    then: Joi.string().min(8).required(),
    otherwise: Joi.string().allow('').optional(),
  }),
  SEED_SUPER_ADMIN_NAME: Joi.string().default('Super Admin'),

  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  APP_NAME: Joi.string().default('SFMS API'),
  API_PREFIX: Joi.string().default('/api'),
  API_VERSION: Joi.string().default('1'),

  CORS_ORIGINS: Joi.string().allow('').default(''),

  SWAGGER_ENABLED: Joi.boolean().default(false),
  SWAGGER_PATH: Joi.string().default('/docs'),

  THROTTLE_TTL_MS: Joi.number().integer().min(1000).default(60_000),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(120),

  DB_ENABLED: Joi.boolean().default(Joi.ref('$dbEnabledDefault')),
  DB_HOST: Joi.string().when('DB_ENABLED', { is: true, then: Joi.required() }),
  DB_PORT: Joi.number()
    .integer()
    .min(1)
    .max(65535)
    .default(5432)
    .when('DB_ENABLED', { is: true, then: Joi.required() }),
  DB_USERNAME: Joi.string().when('DB_ENABLED', { is: true, then: Joi.required() }),
  DB_PASSWORD: Joi.string().allow('').when('DB_ENABLED', { is: true, then: Joi.required() }),
  DB_DATABASE: Joi.string().when('DB_ENABLED', { is: true, then: Joi.required() }),
  DB_SSL: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  DB_SYNCHRONIZE: Joi.boolean().default(false),

  JWT_ACCESS_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().default('dev_access_secret_change_me'),
  }),
  JWT_ACCESS_TTL_SECONDS: Joi.number().integer().min(60).default(900),

  JWT_REFRESH_SECRET: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string().required(),
    otherwise: Joi.string().default('dev_refresh_secret_change_me'),
  }),
  JWT_REFRESH_TTL_SECONDS: Joi.number().integer().min(300).default(60 * 60 * 24 * 7),

  SEED_ENABLED: Joi.boolean().default(false),
}).prefs({ abortEarly: false, convert: true });

export const envValidationOptions = {
  context: {
    dbEnabledDefault: process.env.NODE_ENV !== 'test',
  },
} as const;
