export default interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(
    message: string | Error | unknown,
    meta?: Record<string, unknown> | Error | unknown
  ): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}
