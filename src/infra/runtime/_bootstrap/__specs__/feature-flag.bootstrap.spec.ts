import bootstrapFeatureFlags from '@infra/runtime/_bootstrap/feature-flag.bootstrap';
import featureFlagLifecycle from '@infra/runtime/feature-flag-lifecycle';

jest.mock('../../feature-flag-lifecycle', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    registerShutdown: jest.fn(),
  },
}));

describe('bootstrapFeatureFlags', () => {
  const lifecycle = jest.mocked(featureFlagLifecycle);

  beforeEach(() => {
    lifecycle.initialize.mockReset().mockResolvedValue(undefined);
    lifecycle.registerShutdown.mockReset();
  });

  it('initializes before registering shutdown handling', async () => {
    await bootstrapFeatureFlags();

    expect(lifecycle.initialize).toHaveBeenCalledTimes(1);
    expect(lifecycle.registerShutdown).toHaveBeenCalledTimes(1);
    expect(lifecycle.initialize.mock.invocationCallOrder[0]).toBeLessThan(
      lifecycle.registerShutdown.mock.invocationCallOrder[0]
    );
  });
});
