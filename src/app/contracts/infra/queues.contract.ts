import { ICorrelationId } from '../../../shared/types/correlation-id.types';
import {
  ILedgerAccountBalanceAdjustmentDto,
  ITransactionalEmailDto,
} from '../dto/workers.dto';

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
