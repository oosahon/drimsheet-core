import Sentry from '@sentry/node';
import appContext from '../../app/context';
import IReporter from '../../app/contracts/infra/reporter.contract';
import { parseError } from '../../shared/value-objects/error';
import { NODE_ENV, SENTRY_DSN } from '../config/vars.config';
import logger from './logger';

Sentry.init({ dsn: SENTRY_DSN, sendDefaultPii: true, environment: NODE_ENV });

const getCorrelationId = () => {
  try {
    return appContext.request.get().correlationId;
  } catch (error) {
    logger.error(error);
    return undefined;
  }
};

const reporter: IReporter = {
  report(error, context) {
    try {
      const correlationId = getCorrelationId();
      const parsedError = parseError(error);

      const loggerError = JSON.stringify({
        ...parsedError,
        ...context,
        correlationId,
      });

      logger.error(loggerError);

      if (NODE_ENV === 'local') {
        logger.error(error, { context });
      }

      Sentry.captureException(error, {
        ...context,
        extra: { ...parsedError, correlationId },
      });
    } catch (error) {
      if (NODE_ENV === 'local') {
        logger.error(error, { context });
      }
      logger.error(JSON.stringify(parseError(error)));
    }
  },
  reportAbuse(message, meta) {
    try {
      const correlationId = getCorrelationId();
      const loggerError = JSON.stringify({
        level: 'warning',
        message,
        ...meta,
        correlationId,
      });

      logger.warn(loggerError);

      if (NODE_ENV === 'local') return;

      Sentry.captureMessage(message, {
        level: 'warning',
        extra: { ...meta, correlationId },
      });
    } catch (error) {
      if (NODE_ENV === 'local') {
        logger.error(error);
      }
      logger.error(JSON.stringify(parseError(error)));
    }
  },
};

export default reporter;
