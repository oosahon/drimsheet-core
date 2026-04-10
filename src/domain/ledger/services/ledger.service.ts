import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import { ILedgerAccount } from '../types/ledger.types';
import individualGLSetupHelpers, {
  IBaseIndividualAccountsCreationParams,
} from './individual-gl-setup.helpers';

export interface ILedgerService {
  setupBaseIndividualAccounts(
    params: IBaseIndividualAccountsCreationParams,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<ILedgerAccount, ILedgerAccount>[]>;
}

export default function ledgerService(
  ledgerAccountRepo: ILedgerAccountRepo
): ILedgerService {
  return {
    /**
     * Sets up the following general ledger accounts for an individual:
     *    - Assets:
     *        - Cash and Cash Equivalents: 100000
     *        - Receivables (Tax Credits): 102000
     *    - Liabilities:
     *        - Short Term Loan (Overdraft): 200000
     *        - Payables (Tax Obligations): 201000
     *    - Equity:
     *        - Retained Earnings: 301000
     *        - Opening Balance Equity: 399000
     *    - Revenue:
     *        - Services (Freelance): 401000
     *        - Employment Income: 403000
     *        - Gain on Sale of Assets: 405000
     *        - Unrealized Gain (FX): 406000
     *    - Expenses:
     *        - Direct Costs: 500000
     *        - Rent and Utilities: 502000
     *        - Finance Costs: 507000
     *        - Tax Expense: 508000
     *        - Unrealized Loss (FX): 509000
     *        - Asset Disposal Loss: 510000
     */
    async setupBaseIndividualAccounts(params, repoOptions) {
      const {
        makeBaseAssetAccounts,
        makeBaseLiabilityAccounts,
        makeBaseEquityAccounts,
        makeBaseRevenueAccounts,
        makeBaseExpenseAccounts,
      } = individualGLSetupHelpers(params, ledgerAccountRepo, repoOptions);

      const assetAccounts = await makeBaseAssetAccounts();
      const liabilityAccounts = await makeBaseLiabilityAccounts();
      const equityAccounts = await makeBaseEquityAccounts();
      const revenueAccounts = await makeBaseRevenueAccounts();
      const expenseAccounts = await makeBaseExpenseAccounts();

      const entitiesAndEvents = [
        ...assetAccounts,
        ...liabilityAccounts,
        ...equityAccounts,
        ...revenueAccounts,
        ...expenseAccounts,
      ];

      return entitiesAndEvents;
    },

    // TODO: setup
  };
}
