import { IEvent } from '../../../shared/types/event.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import { IExpenseLedgerAccount } from './expense-account.types';

export default interface IExpenseAccountService {
  bootstrapHeaderAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<{
    accounts: IExpenseLedgerAccount[];
    events: IEvent<IExpenseLedgerAccount>[];
  }>;
}
