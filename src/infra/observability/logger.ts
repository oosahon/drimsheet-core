import * as winston from 'winston';

import ILogger from '@shared/contracts/logger.contract';
import safeJSON from '@shared/utils/safe-json';
import { sanitizeData, SENSITIVE_KEYS } from '@shared/utils/sanitizer';

winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  debug: 'grey',
});

const redactSensitiveDataFormat = winston.format((info) => {
  if (typeof info.message === 'string') {
    info.message = sanitizeData(info.message) as string;
  }

  for (const [key, value] of Object.entries(info)) {
    if (key === 'level' || key === 'message' || key === 'timestamp') {
      continue;
    }
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      (info as Record<string, unknown>)[key] = '[REDACTED]';
    } else {
      (info as Record<string, unknown>)[key] = sanitizeData(value);
    }
  }
  return info;
});

const winstonLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    redactSensitiveDataFormat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        redactSensitiveDataFormat(),
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(
          ({ level, message, timestamp, stack, ...meta }) => {
            const metaStr = Object.keys(meta).length
              ? safeJSON.stringify(meta)
              : '';
            return `${timestamp} [${level}]: ${stack || message} ${metaStr}`;
          }
        )
      ),
    }),
  ],
});

const logger: ILogger = {
  info: (message, meta) => winstonLogger.info(message, meta),
  warn: (message, meta) => winstonLogger.warn(message, meta),
  error: (message, meta) => {
    const sanitizedMsg = sanitizeData(message);
    const sanitizedMeta = sanitizeData(meta);

    if (sanitizedMsg instanceof Error) {
      winstonLogger.error(sanitizedMsg.message, {
        stack: sanitizedMsg.stack,
        ...(typeof sanitizedMeta === 'object' && sanitizedMeta !== null
          ? (sanitizedMeta as Record<string, unknown>)
          : {}),
      });
    } else if (sanitizedMeta instanceof Error) {
      winstonLogger.error(String(sanitizedMsg), {
        stack: sanitizedMeta.stack,
        message: sanitizedMeta.message,
      });
    } else {
      winstonLogger.error(
        String(sanitizedMsg),
        sanitizedMeta as Record<string, unknown>
      );
    }
  },
  debug: (message, meta) => winstonLogger.debug(message, meta),
};

export default logger;
