import { IPaginationParams } from '@shared/values/pagination/types/pagination.types';

import { ICorrelationId } from './correlation-id.types';

export interface ITransactionContext {
  _brand?: 'DrimsheetTransactionContext';
}

export interface IRepoOptions extends ICorrelationId {
  tx?: ITransactionContext;
}

export type IReadRepoOptions = IRepoOptions;

export interface IPaginatedReadRepoOptions
  extends IReadRepoOptions, IPaginationParams {}

export type IWriteRepoOptions<THistory = never> = IRepoOptions &
  ([THistory] extends [never] ? object : { history: THistory });

export type IVersionedRepoWriteOptions<THistory = never> =
  IWriteRepoOptions<THistory> & {
    expectedVersion: number;
  };
