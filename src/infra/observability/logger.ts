import * as winston from 'winston';
import ILogger from '../../shared/contracts/logger.contract';
import safeJSON from '../../shared/utils/safe-json';

winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  debug: 'grey',
});

const winstonLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
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
    if (message instanceof Error) {
      winstonLogger.error(message.message, {
        stack: message.stack,
        ...(typeof meta === 'object' && meta !== null ? meta : {}),
      });
    } else if (meta instanceof Error) {
      winstonLogger.error(String(message), {
        stack: meta.stack,
        message: meta.message,
      });
    } else {
      winstonLogger.error(String(message), meta as Record<string, unknown>);
    }
  },
  debug: (message, meta) => winstonLogger.debug(message, meta),
};

export default logger;
