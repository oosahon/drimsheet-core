import { ICorrelationId } from '../../../shared/types/correlation-id.types';
import {
  ILedgerAccountBalanceAdjustmentDto,
  ITransactionalEmailDto,
} from '../dtos/workers.dto';

export const EQueueName = {
  TransactionalEmail: 'transactional-email-queue',
  LedgerAccountBalanceAdjustment: 'ledger-account-balance-adjustment-queue',
} as const;

export type UQueueName = (typeof EQueueName)[keyof typeof EQueueName];

export type TWorkerRegistrar<WorkerType, PayloadType extends ICorrelationId> = (
  name: string,
  processor: (payload: PayloadType) => Promise<void>
) => WorkerType;

export default interface IQueue {
  addTransactionalEmail(payload: ITransactionalEmailDto): Promise<void>;

  addLedgerAccountBalanceAdjustment(
    payload: ILedgerAccountBalanceAdjustmentDto
  ): Promise<void>;
}
