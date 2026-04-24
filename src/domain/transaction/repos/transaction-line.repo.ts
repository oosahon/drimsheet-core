import { ITransactionLine } from '../types/transaction.types';

export default interface ITransactionLineRepo {
  save(item: ITransactionLine[] | ITransactionLine): Promise<void>;
}
