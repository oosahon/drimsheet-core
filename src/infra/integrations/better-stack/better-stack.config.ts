import IVarsConfig from '@shared/contracts/vars-config.contract';

import vars from '@infra/config/vars.config';

export interface IBetterStackConfig {
  enabled: boolean;
  exportIntervalMs: number;
  logEndpoint: string;
  metricsEndpoint: string;
  shutdownTimeoutMs: number;
  sourceToken: string;
}

const EXPORT_INTERVAL_MS = 60_000;
const SHUTDOWN_TIMEOUT_MS = 5_000;
const INGESTING_HOST_PATTERN =
  /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

function warnInvalidConfiguration(fields: readonly string[]) {
  console.warn('integration.better_stack.configuration_invalid', { fields });
}

export function makeBetterStackConfig(
  varsConfig: IVarsConfig
): IBetterStackConfig {
  const sourceToken = varsConfig.BETTER_STACK_SOURCE_TOKEN;
  const ingestingHost = varsConfig.BETTER_STACK_INGESTING_HOST;
  const isUnconfigured = !sourceToken && !ingestingHost;
  const sourceTokenIsValid =
    sourceToken.length > 0 && sourceToken.trim() === sourceToken;
  const invalidFields = [
    ...(!sourceTokenIsValid ? ['BETTER_STACK_SOURCE_TOKEN'] : []),
    ...(!INGESTING_HOST_PATTERN.test(ingestingHost)
      ? ['BETTER_STACK_INGESTING_HOST']
      : []),
  ];

  if (!isUnconfigured && invalidFields.length) {
    warnInvalidConfiguration(invalidFields);
  }

  const enabled = !isUnconfigured && invalidFields.length === 0;
  const logEndpoint = enabled ? `https://${ingestingHost}` : '';

  return Object.freeze({
    enabled,
    exportIntervalMs: EXPORT_INTERVAL_MS,
    logEndpoint,
    metricsEndpoint: enabled ? `${logEndpoint}/v1/metrics` : '',
    shutdownTimeoutMs: SHUTDOWN_TIMEOUT_MS,
    sourceToken: enabled ? sourceToken : '',
  });
}

export const BETTER_STACK_CONFIG = makeBetterStackConfig(vars);
