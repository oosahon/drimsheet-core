import { init } from '@launchdarkly/node-server-sdk';

import launchDarklyClient from '@infra/config/launchdarkly.config';

jest.mock('@launchdarkly/node-server-sdk', () => ({
  init: jest.fn(() => 'launchdarkly-client'),
}));

jest.mock('@infra/config/vars.config', () => ({
  __esModule: true,
  default: { LAUNCHDARKLY_SDK_KEY: 'test-sdk-key' },
}));

describe('launchdarkly config', () => {
  it('creates the process client with the configured server SDK key', () => {
    expect(init).toHaveBeenCalledWith('test-sdk-key');
    expect(launchDarklyClient).toBe('launchdarkly-client');
  });
});
