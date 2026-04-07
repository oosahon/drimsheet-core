import Sentry from '@sentry/node';
import { NODE_ENV, SENTRY_DSN } from '../config/vars.config';
import logger from './logger';
import IReporter from '../../app/contracts/infra/reporter.contract';

Sentry.init({ dsn: SENTRY_DSN, sendDefaultPii: true, environment: NODE_ENV });

const reporter: IReporter = {
  report(error, context) {
    try {
      if (NODE_ENV === 'development') {
        return logger.error(error);
      }
      return Sentry.captureException(error, context);
    } catch (error) {
      logger.error(error);
    }
  },
};

export default reporter;
