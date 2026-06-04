import { IAccountingEntity } from '../../../domain/accounting/types/accounting-entity.types';
import { IUser } from '../../../domain/user/types/user.types';
import { ICorrelationId } from '../../../shared/types/correlation-id.types';
import { IIdempotencyKey } from '../../../shared/types/idempotency-key.types';

export interface IClientSession {
  setRefreshToken(token: string): void;
  getRefreshToken(): string | null;
  clearRefreshToken(): void;
}

export interface IRequestContextData extends ICorrelationId, IIdempotencyKey {
  user: IUser;
  accountingEntity: IAccountingEntity;
  clientSession: IClientSession;
}

export default interface IRequestContext {
  init: (store: IRequestContextData, callback: () => void) => void;
  get(): IRequestContextData;
  set: (store: Partial<IRequestContextData>) => void;
}
