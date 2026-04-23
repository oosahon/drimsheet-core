import { ITransactionLineItem } from '../types/transaction.types';

export default interface ITransactionLineItemRepo {
  save(item: ITransactionLineItem[] | ITransactionLineItem): Promise<void>;
}
