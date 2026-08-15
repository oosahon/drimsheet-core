import Sentry from '@sentry/node';

import IReporter from '@shared/contracts/reporter.contract';
import errorUtils from '@shared/utils/error';
import { sanitizeData } from '@shared/utils/sanitizer';

import vars from '@infra/config/vars.config';
import safeGetCorrelationId from '@infra/observability/helpers/get-correlation-id';

import logger from './logger';

const reporter: IReporter = {
  report(event, error, context) {
    try {
      const correlationId = safeGetCorrelationId();
      const sanitizedError = sanitizeData(error);
      const sanitizedContext =
        (sanitizeData(context) as Record<string, unknown>) || {};
      const parsedError = errorUtils.parseError(sanitizedError);

      logger.error(event, {
        ...sanitizedContext,
        error: sanitizedError,
        errorKey: parsedError.errorKey,
      });

      Sentry.captureException(sanitizedError, {
        extra: {
          ...sanitizedContext,
          ...parsedError,
          correlationId,
        },
      });
    } catch (reportingError) {
      logger.error('observability.error.reporting_failed', {
        error: reportingError,
        sourceEvent: event,
        context: sanitizeData(context),
      });
    }
  },

  reportAbuse(message, meta) {
    try {
      const correlationId = safeGetCorrelationId();
      const sanitizedMessage =
        (sanitizeData(message) as string) || String(message);
      const sanitizedMeta =
        (sanitizeData(meta) as Record<string, unknown>) || {};

      logger.warn('security.abuse.detected', {
        ...sanitizedMeta,
        message: sanitizedMessage,
      });

      if (vars.APP_ENV === 'local') return;

      Sentry.captureMessage(sanitizedMessage, {
        level: 'warning',
        extra: { ...sanitizedMeta, correlationId },
      });
    } catch (reportingError) {
      logger.error('observability.error.reporting_failed', {
        error: reportingError,
        sourceEvent: 'security.abuse.detected',
        context: sanitizeData(meta),
      });
    }
  },
};

export default reporter;
