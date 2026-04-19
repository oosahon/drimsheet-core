import { ITransactionItem } from '../types/transaction.types';

export default interface ITransactionItemRepo {
  save(item: ITransactionItem[] | ITransactionItem): Promise<void>;
}
