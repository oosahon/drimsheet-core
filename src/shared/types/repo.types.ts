import { IPaginationParams } from '../values/pagination/types/pagination.types';
import { ICorrelationId } from './correlation-id.types';

export interface ITransactionContext {
  _brand?: 'PurpleLedgerTransactionContext';
}

export interface IRepoOptions extends ICorrelationId {
  tx?: ITransactionContext;
}

export const ERepoLock = {
  Update: 'update',
  NoKeyUpdate: 'no key update',
  Share: 'share',
  KeyShare: 'key share',
} as const;

export type URepoLock = (typeof ERepoLock)[keyof typeof ERepoLock];

export interface IReadRepoOptions extends IRepoOptions {
  lock?: URepoLock;
}

export interface IPaginatedReadRepoOptions
  extends IReadRepoOptions, IPaginationParams {}

interface IBaseWriteRepoOptions extends IRepoOptions {
  expectedVersion?: number;
}

export type IWriteRepoOptions<THistory = never> = IBaseWriteRepoOptions &
  ([THistory] extends [never] ? object : { history: THistory });
