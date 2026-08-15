export const ELogLevel = {
  Info: 'info',
  Warn: 'warn',
  Error: 'error',
  Debug: 'debug',
} as const;

export type ULogLevel = (typeof ELogLevel)[keyof typeof ELogLevel];

export const ELogOutcome = {
  Success: 'success',
  Failure: 'failure',
  Rejected: 'rejected',
  Skipped: 'skipped',
  Cancelled: 'cancelled',
  Unknown: 'unknown',
} as const;

export type ULogOutcome = (typeof ELogOutcome)[keyof typeof ELogOutcome];

export interface ILogFields {
  message?: string;
  outcome?: ULogOutcome;
  durationMs?: number;
  error?: unknown;
  errorKey?: string;
  [key: string]: unknown;
}

export interface IObservabilityMetricsConfig {
  enabled: boolean;
  exportIntervalMs: number;
  otlpHttpEndpoint: string;
  shutdownTimeoutMs: number;
  bullMQMetricsPort: number;
}
