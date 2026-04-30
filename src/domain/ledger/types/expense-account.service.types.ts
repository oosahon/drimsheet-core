import { IEvent, TEntityWithEvents } from '../../../shared/types/event.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import {
  IAssetDisposalLossAccount,
  IDirectCostsAccount,
  IExpenseLedgerAccount,
  IIncomeTaxExpenseAccount,
  IInterestFinanceAccount,
  IRentUtilitiesAccount,
  IUnrealizedLossAccount,
} from './expense-account.types';

export default interface IExpenseAccountService {
  bootstrapHeaderAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions,
    shouldBootstrapPostingAccounts?: boolean
  ): Promise<{
    accounts: IExpenseLedgerAccount[];
    events: IEvent<IExpenseLedgerAccount>[];
  }>;

  bootstrapIndividualPostingAccounts(
    accountingEntity: IAccountingEntity,
    headers: {
      directCostsHeader: IDirectCostsAccount;
      rentAndUtilitiesHeader: IRentUtilitiesAccount;
      financeCostsHeader: IInterestFinanceAccount;
      taxExpenseHeader: IIncomeTaxExpenseAccount;
      unrealizedLossHeader: IUnrealizedLossAccount;
      assetDisposalLossHeader: IAssetDisposalLossAccount;
    },
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<IExpenseLedgerAccount, IExpenseLedgerAccount>[]>;
}
