import {
  IEvent,
  TAuditedEntity,
} from '../../../../shared/events/types/event.types';
import { IEntityDelta } from '../../../../shared/history/types/history.types';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import { IAccountingEntity } from '../../../accounting/types/accounting-entity.types';
import { ILedgerAccount } from '../../shared/types/ledger.types';
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
