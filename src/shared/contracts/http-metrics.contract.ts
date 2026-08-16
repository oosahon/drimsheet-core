import { ULogOutcome } from '@shared/types/observability.types';

interface IRecordRequestCompletedInput {
  method: string;
  route: string;
  statusCode: number;
  outcome: ULogOutcome;
  durationMs: number;
}

export default interface IHttpMetrics {
  /** Best-effort recording must never throw to delivery behavior. */
  recordRequestCompleted(input: IRecordRequestCompletedInput): void;
}
