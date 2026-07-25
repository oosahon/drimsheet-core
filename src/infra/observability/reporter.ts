import Sentry from '@sentry/node';
import IReporter from '../../shared/contracts/reporter.contract';
import errorUtils from '../../shared/utils/error';
import safeJSON from '../../shared/utils/safe-json';
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
      const parsedError = errorUtils.parseError(error);

      const loggerError = safeJSON.stringify({
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
      logger.error(safeJSON.stringify(errorUtils.parseError(error)));
    }
  },
  reportAbuse(message, meta) {
    try {
      const correlationId = getCorrelationId();
      const loggerError = safeJSON.stringify({
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
      logger.error(safeJSON.stringify(errorUtils.parseError(error)));
    }
  },
};

export default reporter;
