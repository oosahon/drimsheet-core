import generateUUID from '@shared/utils/uuid-generator';

import launchDarklyClient from '@infra/config/launchdarkly.config';
import featureFlagService from '@infra/services/feature-flag.service';

jest.mock('../../config/launchdarkly.config', () => ({
  __esModule: true,
  default: {
    boolVariation: jest.fn(),
  },
}));

describe('featureFlagService', () => {
  const client = jest.mocked(launchDarklyClient);

  beforeEach(() => {
    client.boolVariation.mockReset();
  });

  it('evaluates Alpha 1 access for the user', async () => {
    const userId = generateUUID();
    client.boolVariation.mockResolvedValue(true);

    await expect(featureFlagService.accessAlpha1({ userId })).resolves.toBe(
      true
    );
    expect(client.boolVariation).toHaveBeenCalledWith(
      'v_0_1_0_alpha_1',
      { kind: 'user', key: userId },
      false
    );
  });

  it('returns the false fallback from LaunchDarkly', async () => {
    client.boolVariation.mockResolvedValue(false);

    await expect(
      featureFlagService.accessAlpha1({ userId: generateUUID() })
    ).resolves.toBe(false);
  });
});
