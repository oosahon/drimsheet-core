import * as winston from 'winston';

import ILogger from '@shared/contracts/logger.contract';
import IVarsConfig from '@shared/contracts/vars-config.contract';
import {
  ELogLevel,
  ILogFields,
  ULogLevel,
} from '@shared/types/observability.types';
import safeJSON from '@shared/utils/safe-json';
import { sanitizeData } from '@shared/utils/sanitizer';

import IAppContext from '@app/context/contracts/app-context.contract';

import vars from '@infra/config/vars.config';
import safeGetCorrelationId from '@infra/observability/helpers/get-correlation-id';

import packageJson from '../../../package.json';

type TCorrelationContext = Pick<IAppContext, 'get'>;

interface ILoggerOptions {
  appContext?: TCorrelationContext;
  appEnv?: IVarsConfig['APP_ENV'];
  service?: string;
  transport?: winston.transport;
  version?: string;
}

const LOGGER_OWNED_FIELDS = new Set([
  'timestamp',
  'level',
  'event',
  'service',
  'environment',
  'version',
  'correlationId',
  'traceId',
  'spanId',
]);

const LOCAL_PREFIX_FIELDS = new Set([
  'timestamp',
  'level',
  'event',
  'message',
  'service',
  'environment',
  'version',
]);

winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'blue',
  debug: 'grey',
});

const omitEmptyMessageFormat = winston.format((info) => {
  if (info.message === '') delete info.message;
  return info;
});

const localFormat = winston.format.combine(
  winston.format.colorize({ level: true }),
  winston.format.printf((fields) => {
    const humanMessage = fields.message ? `: ${String(fields.message)}` : '';
    const staticContext = `${fields.service} ${fields.environment}@${fields.version}`;
    const metadataFields = Object.fromEntries(
      Object.entries(fields).filter(
        ([field]) => !LOCAL_PREFIX_FIELDS.has(field)
      )
    );
    const metadata = Object.keys(metadataFields).length
      ? ` ${safeJSON.stringify(metadataFields)}`
      : '';

    return `${fields.timestamp} [${fields.level}] ${fields.event}${humanMessage} (${staticContext})${metadata}`;
  })
);

const jsonFormat = winston.format.combine(
  omitEmptyMessageFormat(),
  winston.format.json()
);

function normalizeError(error: unknown): unknown {
  const sanitizedError = sanitizeData(error);

  if (!(sanitizedError instanceof Error)) return sanitizedError;

  return Object.getOwnPropertyNames(sanitizedError).reduce<
    Record<string, unknown>
  >((normalizedError, key) => {
    normalizedError[key] = (
      sanitizedError as unknown as Record<string, unknown>
    )[key];
    return normalizedError;
  }, {});
}

function prepareFields(fields: ILogFields = {}): ILogFields {
  const sanitizedFields = (sanitizeData(fields) as ILogFields) || {};
  const error = fields?.error;

  LOGGER_OWNED_FIELDS.forEach((field) => delete sanitizedFields[field]);

  if (error !== undefined) {
    sanitizedFields.error = normalizeError(error);

    if (
      sanitizedFields.error &&
      typeof sanitizedFields.error === 'object' &&
      'errorKey' in sanitizedFields.error
    ) {
      sanitizedFields.errorKey = (
        sanitizedFields.error as Record<string, unknown>
      ).errorKey as string;
    }
  }

  return sanitizedFields;
}

export function makeLogger(options: ILoggerOptions = {}): ILogger {
  const appEnv = options.appEnv ?? vars.APP_ENV;
  const service = options.service ?? packageJson.name;
  const version = options.version ?? vars.APP_VERSION;

  const winstonLogger = winston.createLogger({
    level: 'debug',
    format: appEnv === 'local' ? localFormat : jsonFormat,
    transports: [options.transport ?? new winston.transports.Console()],
  });

  const log = (level: ULogLevel, event: string, fields?: ILogFields) => {
    const correlationId = safeGetCorrelationId(options.appContext);
    const preparedFields = prepareFields(fields);

    winstonLogger.log({
      ...preparedFields,
      timestamp: new Date().toISOString(),
      level,
      event: sanitizeData(event) as string,
      service,
      environment: appEnv,
      version,
      ...(correlationId ? { correlationId } : {}),
      message: preparedFields.message ?? '',
    });
  };

  const logger: ILogger = {
    info: (event, fields) => log(ELogLevel.Info, event, fields),
    warn: (event, fields) => log(ELogLevel.Warn, event, fields),
    error: (event, fields) => log(ELogLevel.Error, event, fields),
    debug: (event, fields) => log(ELogLevel.Debug, event, fields),
  };

  return logger;
}

export default makeLogger();
