import Sentry from '@sentry/node';

import vars from '@infra/config/vars.config';
import setupObservability from '@infra/observability/setup';

jest.mock('@sentry/node', () => ({
  init: jest.fn(),
}));

describe('setupObservability', () => {
  it('uses the application environment and package-derived version', () => {
    setupObservability();

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: vars.APP_ENV,
        release: vars.APP_VERSION,
      })
    );
  });
});
