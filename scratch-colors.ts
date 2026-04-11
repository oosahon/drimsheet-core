import * as winston from 'winston';

winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  debug: 'grey',
});

const logger = winston.createLogger({
  level: 'debug',
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
  },
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
      return `${timestamp} [${level}]: ${stack || message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

logger.error('Error with string message');
logger.warn('Warn with string message');
logger.info('Info with string message');
logger.debug('Debug string message');
