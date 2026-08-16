import { ICorrelationId } from '@shared/types/correlation-id.types';
import { IIdempotencyKey } from '@shared/types/idempotency-key.types';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import { IUser } from '@domain/user/types/user.types';

export interface IClientSession {
  setRefreshToken(token: string): void;
  getRefreshToken(): string | null;
  clearRefreshToken(): void;
}

export interface IAppContextData extends ICorrelationId, IIdempotencyKey {
  user?: IUser;
  accountingEntity?: IAccountingEntity;
  clientSession?: IClientSession;
}

export type TAppContextWithRequiredKeys<K extends keyof IAppContextData> =
  IAppContextData & Required<Pick<IAppContextData, K>>;

export default interface IAppContext {
  init<T>(store: IAppContextData, callback: () => T): T;
  get<K extends keyof IAppContextData = never>(
    requiredKeys?: readonly K[]
  ): TAppContextWithRequiredKeys<K>;
  set: (store: Partial<IAppContextData>) => void;
}
