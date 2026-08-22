import IVarsConfig from '@shared/contracts/vars-config.contract';

import {
  BETTER_STACK_CONFIG,
  makeBetterStackConfig,
} from '@infra/config/better-stack.config';
import vars from '@infra/config/vars.config';

function makeVarsConfig(overrides: Partial<IVarsConfig> = {}): IVarsConfig {
  return { ...vars, ...overrides };
}

describe('Better Stack config', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps remote export disabled with fixed internal bounds by default', () => {
    expect(BETTER_STACK_CONFIG).toEqual({
      enabled: false,
      exportIntervalMs: 60_000,
      logEndpoint: '',
      metricsEndpoint: '',
      shutdownTimeoutMs: 5_000,
      sourceToken: '',
    });
    expect(Object.isFrozen(BETTER_STACK_CONFIG)).toBe(true);
  });

  it('derives HTTPS log and metrics endpoints from one complete source pair', () => {
    const config = makeBetterStackConfig(
      makeVarsConfig({
        BETTER_STACK_SOURCE_TOKEN: 'source-token',
        BETTER_STACK_INGESTING_HOST: 's123.eu-nbg-2.betterstackdata.com',
      })
    );

    expect(config).toEqual({
      enabled: true,
      exportIntervalMs: 60_000,
      logEndpoint: 'https://s123.eu-nbg-2.betterstackdata.com',
      metricsEndpoint: 'https://s123.eu-nbg-2.betterstackdata.com/v1/metrics',
      shutdownTimeoutMs: 5_000,
      sourceToken: 'source-token',
    });
    expect(console.warn).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: 'missing source token',
      overrides: {
        BETTER_STACK_INGESTING_HOST: 's123.eu-nbg-2.betterstackdata.com',
      },
      fields: ['BETTER_STACK_SOURCE_TOKEN'],
    },
    {
      name: 'missing ingesting host',
      overrides: { BETTER_STACK_SOURCE_TOKEN: 'source-token' },
      fields: ['BETTER_STACK_INGESTING_HOST'],
    },
    {
      name: 'host containing a URL scheme',
      overrides: {
        BETTER_STACK_SOURCE_TOKEN: 'source-token',
        BETTER_STACK_INGESTING_HOST:
          'https://s123.eu-nbg-2.betterstackdata.com',
      },
      fields: ['BETTER_STACK_INGESTING_HOST'],
    },
    {
      name: 'blank source token',
      overrides: {
        BETTER_STACK_SOURCE_TOKEN: ' ',
        BETTER_STACK_INGESTING_HOST: 's123.eu-nbg-2.betterstackdata.com',
      },
      fields: ['BETTER_STACK_SOURCE_TOKEN'],
    },
  ])(
    'warns once and disables both paths for $name',
    ({ overrides, fields }) => {
      const config = makeBetterStackConfig(makeVarsConfig(overrides));

      expect(config).toEqual({
        enabled: false,
        exportIntervalMs: 60_000,
        logEndpoint: '',
        metricsEndpoint: '',
        shutdownTimeoutMs: 5_000,
        sourceToken: '',
      });
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        'integration.better_stack.configuration_invalid',
        { fields }
      );
    }
  );
});
