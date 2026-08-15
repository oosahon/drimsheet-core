export type TLogOutcome =
  | 'success'
  | 'failure'
  | 'rejected'
  | 'skipped'
  | 'cancelled'
  | 'unknown';

export interface ILogFields {
  message?: string;
  outcome?: TLogOutcome;
  durationMs?: number;
  error?: unknown;
  errorKey?: string;
  [key: string]: unknown;
}

export default interface ILogger {
  info(event: string, fields?: ILogFields): void;
  warn(event: string, fields?: ILogFields): void;
  error(event: string, fields?: ILogFields): void;
  debug(event: string, fields?: ILogFields): void;
}
