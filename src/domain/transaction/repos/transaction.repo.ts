import { ITransaction } from '../types/transaction.types';

export default interface ITransactionRepo {
  save(transaction: ITransaction[] | ITransaction): Promise<void>;
}
