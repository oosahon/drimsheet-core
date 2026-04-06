import { ICorrelationId } from '../../../shared/types/correlation-id.types';
import { IIdempotencyKey } from '../../../shared/types/idempotency-key.types';
import { UAccountingEntityType } from '../../../domain/accounting/types/accounting.types';
import { IUser } from '../../../domain/user/types/user.types';

export interface IRequestContextData extends ICorrelationId, IIdempotencyKey {
  user: IUser | null;
  accountingEntityType: UAccountingEntityType;
}

export default interface IRequestContext {
  init: (store: IRequestContextData, callback: () => void) => void;
  get(): IRequestContextData;
}
