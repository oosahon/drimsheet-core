import { ITransactionHistoryLog } from '../types/transaction.types';

export default interface ITransactionHistoryRepo {
  save(
    history: ITransactionHistoryLog[] | ITransactionHistoryLog
  ): Promise<void>;
}
