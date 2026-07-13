import { IAccountingEntity } from '../../domain/accounting/types/accounting-entity.types';
import { IUser } from '../../domain/user/types/user.types';
import { ICorrelationId } from '../types/correlation-id.types';
import { IIdempotencyKey } from '../types/idempotency-key.types';

export interface IClientSession {
  setRefreshToken(token: string): void;
  getRefreshToken(): string | null;
  clearRefreshToken(): void;
}

export interface IAppContextData extends ICorrelationId, IIdempotencyKey {
  user: IUser;
  accountingEntity: IAccountingEntity;
  clientSession: IClientSession;
}

export default interface IAppContext {
  init: (store: IAppContextData, callback: () => void) => void;
  get(): IAppContextData;
  set: (store: Partial<IAppContextData>) => void;
}
