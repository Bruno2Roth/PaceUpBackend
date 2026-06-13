import winston from 'winston';
import fs from 'fs';
import path from 'path';
import config from './environment.js';

const levels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5,
};

const colors = {
  fatal: 'red',
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  trace: 'gray',
};

winston.addColors(colors);

const logDir = config.logging.dir || 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, correlationId, ...meta }) => {
    let msg = `[${timestamp}] [${level}] ${message}`;
    if (correlationId) msg += ` [corr:${correlationId}]`;
    const rest = Object.keys(meta).filter(k => !['level', 'message', 'timestamp', 'correlationId', 'splat'].includes(k));
    if (rest.length > 0) {
      msg += ` ${JSON.stringify(meta, null, 0)}`;
    }
    return msg;
  }),
);

const transports = [
  new winston.transports.Console({
    format: config.nodeEnv === 'production' && config.logging.json ? jsonFormat : consoleFormat,
  }),
];

const fileTransports = [
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: jsonFormat,
    maxsize: 100 * 1024 * 1024,
    maxFiles: 30,
  }),
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log'),
    format: jsonFormat,
    maxsize: 100 * 1024 * 1024,
    maxFiles: 30,
  }),
  new winston.transports.File({
    filename: path.join(logDir, 'audit.log'),
    level: 'info',
    format: jsonFormat,
    maxsize: 100 * 1024 * 1024,
    maxFiles: 90,
  }),
];

export const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format: jsonFormat,
  transports: [...transports, ...fileTransports],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
      format: jsonFormat,
      maxsize: 100 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
      format: jsonFormat,
      maxsize: 100 * 1024 * 1024,
      maxFiles: 10,
    }),
  ],
});

export default logger;
