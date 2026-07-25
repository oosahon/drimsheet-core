import Sentry from '@sentry/node';
import IReporter from '../../shared/contracts/reporter.contract';
import errorUtils from '../../shared/utils/error';
import safeJSON from '../../shared/utils/safe-json';
import { sanitizeData } from '../../shared/utils/sanitizer';
import { NODE_ENV } from '../config/vars.config';
import appContext from '../runtime/app-context';
import logger from './logger';

// TODO: add tests for observability

const getCorrelationId = () => {
  try {
    return appContext.get().correlationId;
  } catch {
    return undefined;
  }
};

const reporter: IReporter = {
  report(error, context) {
    try {
      const correlationId = getCorrelationId();
      const sanitizedError = sanitizeData(error);
      const sanitizedContext =
        (sanitizeData(context) as Record<string, unknown>) || {};
      const parsedError = errorUtils.parseError(sanitizedError);

      const loggerError = safeJSON.stringify({
        ...parsedError,
        ...sanitizedContext,
        correlationId,
      });

      logger.error(loggerError);

      if (NODE_ENV === 'local') {
        logger.error(sanitizedError, { context: sanitizedContext });
      }

      Sentry.captureException(sanitizedError, {
        ...sanitizedContext,
        extra: { ...parsedError, correlationId },
      });
    } catch (err) {
      if (NODE_ENV === 'local') {
        logger.error(err, { context: sanitizeData(context) });
      }
      logger.error(safeJSON.stringify(errorUtils.parseError(err)));
    }
  },

  reportAbuse(message, meta) {
    try {
      const correlationId = getCorrelationId();
      const sanitizedMessage =
        (sanitizeData(message) as string) || String(message);
      const sanitizedMeta =
        (sanitizeData(meta) as Record<string, unknown>) || {};

      const loggerError = safeJSON.stringify({
        level: 'warning',
        message: sanitizedMessage,
        ...sanitizedMeta,
        correlationId,
      });

      logger.warn(loggerError);

      if (NODE_ENV === 'local') return;

      Sentry.captureMessage(sanitizedMessage, {
        level: 'warning',
        extra: { ...sanitizedMeta, correlationId },
      });
    } catch (err) {
      if (NODE_ENV === 'local') {
        logger.error(err);
      }
      logger.error(safeJSON.stringify(errorUtils.parseError(err)));
    }
  },
};

export default reporter;
