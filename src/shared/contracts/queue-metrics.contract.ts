export const EQueueTransport = {
  BullMQ: 'bullmq',
} as const;

export type UQueueTransport =
  (typeof EQueueTransport)[keyof typeof EQueueTransport];

interface IRecordEnqueueSucceededInput {
  queueName: string;
  transport: UQueueTransport;
}

interface IRecordEnqueueFailedInput {
  queueName: string;
  transport: UQueueTransport;
}

interface IRecordProcessingCompletedInput {
  queueName: string;
  transport: UQueueTransport;
  attempt?: number;
  durationMs: number;
  waitingDurationMs?: number;
}

interface IRecordProcessingFailedInput {
  queueName: string;
  transport: UQueueTransport;
  attempt?: number;
  durationMs: number;
  waitingDurationMs?: number;
}

export default interface IQueueMetrics {
  /** Best-effort recording operations must never throw to queue behavior. */
  recordEnqueueSucceeded(input: IRecordEnqueueSucceededInput): void;
  recordEnqueueFailed(input: IRecordEnqueueFailedInput): void;
  recordProcessingCompleted(input: IRecordProcessingCompletedInput): void;
  recordProcessingFailed(input: IRecordProcessingFailedInput): void;
}
