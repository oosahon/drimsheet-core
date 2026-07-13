import { IRepoOptions, ITransactionContext } from '../types/repo.types';

export default function passOnRepoTransaction(
  options: IRepoOptions,
  tx: unknown
) {
  return {
    ...options,
    tx: tx as ITransactionContext,
  };
}
