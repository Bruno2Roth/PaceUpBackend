import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  apiVersion: process.env.API_VERSION || 'v1',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'paceup_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 2,
    poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
    expiration: process.env.JWT_EXPIRATION || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '30d',
  },

  api: {
    paginationLimit: parseInt(process.env.API_PAGINATION_LIMIT, 10) || 20,
    corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  },

  rateLimiter: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'combined',
    json: process.env.LOG_JSON !== 'false',
    dir: process.env.LOG_DIR || 'logs',
    maxSize: process.env.LOG_MAX_SIZE || '100m',
    maxFiles: process.env.LOG_MAX_FILES || '30d',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    url: process.env.REDIS_URL,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY || 'aes-256-gcm-key-32bytes-pad!!',
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
  },

  mapbox: {
    token: process.env.MAPBOX_TOKEN,
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },

  garmin: {
    apiUrl: process.env.GARMIN_API_URL || 'https://connectapi.garmin.com',
    clientId: process.env.GARMIN_CLIENT_ID,
    clientSecret: process.env.GARMIN_CLIENT_SECRET,
  },

  coros: {
    apiUrl: process.env.COROS_API_URL || 'https://api.coros.com',
    apiKey: process.env.COROS_API_KEY,
  },

  polar: {
    apiUrl: process.env.POLAR_API_URL || 'https://www.polaraccesslink.com',
    clientId: process.env.POLAR_CLIENT_ID,
    clientSecret: process.env.POLAR_CLIENT_SECRET,
  },

  suunto: {
    apiUrl: process.env.SUUNTO_API_URL || 'https://suunto-api.com',
    apiKey: process.env.SUUNTO_API_KEY,
  },

  apple: {
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
  },

  wearos: {
    apiKey: process.env.WEAROS_API_KEY,
  },

  email: {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    fromName: process.env.SMTP_FROM_NAME || 'PaceUp',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'noreply@paceup.com',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@paceup.com',
    password: process.env.ADMIN_PASSWORD || 'change_me_in_production',
  },

  alert: {
    email: process.env.ALERT_EMAIL,
    discordWebhook: process.env.ALERT_DISCORD_WEBHOOK,
    slackWebhook: process.env.ALERT_SLACK_WEBHOOK,
  },

  backup: {
    pgDumpPath: process.env.PG_DUMP_PATH || 'pg_dump',
    dir: process.env.BACKUP_DIR || 'backups',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS, 10) || 30,
  },

  // stripe: {
  //   secretKey: process.env.STRIPE_SECRET_KEY,
  //   webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  //   premiumMonthlyPriceId: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
  //   premiumYearlyPriceId: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID,
  //   coachPlusPriceId: process.env.STRIPE_COACH_PLUS_PRICE_ID,
  // },

  // mercadopago: {
  //   accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  //   publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
  // },

  app: {
    url: process.env.APP_URL || 'https://paceup.app',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@paceup.com',
  },

  // trial: {
  //   defaultDurationDays: parseInt(process.env.TRIAL_DEFAULT_DAYS, 10) || 7,
  // },

  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true,
  },
};

export default config;
