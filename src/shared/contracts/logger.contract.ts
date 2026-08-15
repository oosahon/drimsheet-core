import { ILogFields } from '@shared/types/observability.types';

export default interface ILogger {
  info(event: string, fields?: ILogFields): void;
  warn(event: string, fields?: ILogFields): void;
  error(event: string, fields?: ILogFields): void;
  debug(event: string, fields?: ILogFields): void;
}
