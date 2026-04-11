import Sentry from '@sentry/node';
import appContext from '../../app/context';
import IReporter from '../../app/contracts/infra/reporter.contract';
import { parseError } from '../../shared/value-objects/error';
import { NODE_ENV, SENTRY_DSN } from '../config/vars.config';
import logger from './logger';

Sentry.init({ dsn: SENTRY_DSN, sendDefaultPii: true, environment: NODE_ENV });

const reporter: IReporter = {
  report(error, context) {
    try {
      const correlationId = appContext.request.get().correlationId;
      const parsedError = parseError(error);

      const loggerError = JSON.stringify({
        ...parsedError,
        ...context,
        correlationId,
      });

      logger.error(loggerError);

      if (NODE_ENV === 'local') return;

      Sentry.captureException(error, {
        ...context,
        extra: { ...parsedError, correlationId },
      });
    } catch (error) {
      logger.error(JSON.stringify(parseError(error)));
    }
  },
};

export default reporter;
