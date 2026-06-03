import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  apiVersion: process.env.API_VERSION || 'v1',

  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'paceup_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 2,
    poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    algorithm: process.env.JWT_ALGORITHM || 'HS256',
    expiration: process.env.JWT_EXPIRATION || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '30d',
  },

  // API Configuration
  api: {
    paginationLimit: parseInt(process.env.API_PAGINATION_LIMIT, 10) || 20,
    corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  },

  // Rate Limiter
  rateLimiter: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'combined',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Mapbox
  mapbox: {
    token: process.env.MAPBOX_TOKEN,
  },

  // Garmin
  garmin: {
    apiUrl: process.env.GARMIN_API_URL || 'https://connectapi.garmin.com',
    clientId: process.env.GARMIN_CLIENT_ID,
    clientSecret: process.env.GARMIN_CLIENT_SECRET,
  },

  // COROS
  coros: {
    apiUrl: process.env.COROS_API_URL || 'https://api.coros.com',
    apiKey: process.env.COROS_API_KEY,
  },

  // Polar
  polar: {
    apiUrl: process.env.POLAR_API_URL || 'https://www.polaraccesslink.com',
    clientId: process.env.POLAR_CLIENT_ID,
    clientSecret: process.env.POLAR_CLIENT_SECRET,
  },

  // Suunto
  suunto: {
    apiUrl: process.env.SUUNTO_API_URL || 'https://suunto-api.com',
    apiKey: process.env.SUUNTO_API_KEY,
  },

  // Apple Health
  apple: {
    teamId: process.env.APPLE_TEAM_ID,
    keyId: process.env.APPLE_KEY_ID,
  },

  // Wear OS
  wearos: {
    apiKey: process.env.WEAROS_API_KEY,
  },

  // Email
  email: {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT, 10),
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
  },

  // Admin
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@paceup.com',
    password: process.env.ADMIN_PASSWORD || 'change_me_in_production',
  },
};

export default config;
