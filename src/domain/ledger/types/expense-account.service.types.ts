import { IEvent, TAuditedEntity } from '../../../shared/types/event.types';
import { IEntityDelta } from '../../../shared/types/history.types';
import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
import {
  IAssetDisposalLossAccount,
  IBankChargeAccount,
  IDirectCostsAccount,
  IExpenseLedgerAccount,
  IFinanceCostAccount,
  IIncomeTaxExpenseAccount,
  IInterestAccount,
  IRentUtilitiesAccount,
  IUnrealizedLossAccount,
} from './expense-account.types';
import { ILedgerAccount } from './ledger.types';

export default interface IExpenseAccountService {
  bootstrapHeaderAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IReadRepoOptions,
    shouldBootstrapPostingAccounts?: boolean
  ): Promise<{
    accounts: IExpenseLedgerAccount[];
    events: IEvent<IExpenseLedgerAccount>[];
    audits: IEntityDelta<ILedgerAccount>[];
  }>;

  bootstrapIndividualPostingAccounts(
    accountingEntity: IAccountingEntity,
    headers: {
      directCostsHeader: IDirectCostsAccount;
      rentAndUtilitiesHeader: IRentUtilitiesAccount;
      bankChargeHeader: IBankChargeAccount;
      financeCostHeader: IFinanceCostAccount;
      interestHeader: IInterestAccount;
      taxExpenseHeader: IIncomeTaxExpenseAccount;
      unrealizedLossHeader: IUnrealizedLossAccount;
      assetDisposalLossHeader: IAssetDisposalLossAccount;
    },
    repoOptions: IReadRepoOptions
  ): Promise<
    TAuditedEntity<
      IExpenseLedgerAccount,
      IExpenseLedgerAccount,
      ILedgerAccount
    >[]
  >;
}
