import { TAuditedEntity } from '@shared/values/events/types/event.types';
import historyValue from '@shared/values/history/history.vo';

import { ASSET_LEDGER_CODES } from '@domain/ledger/config/asset-codes.config';
import { EXPENSE_LEDGER_CODES } from '@domain/ledger/config/expense-codes.config';
import { LIABILITY_LEDGER_CODES } from '@domain/ledger/config/liability-codes.config';
import { REVENUE_LEDGER_CODES } from '@domain/ledger/config/revenue-codes.config';
import { IAssetDisposalLossAccountService } from '@domain/ledger/types/asset-disposal-loss.service.types';
import { IBankChargeAccountService } from '@domain/ledger/types/bank-charge.service.types';
import { IDirectCostsAccountService } from '@domain/ledger/types/direct-costs.service.types';
import { IEmploymentIncomeAccountService } from '@domain/ledger/types/employment-income.service.types';
import { EExpenseAccountBehavior } from '@domain/ledger/types/expense-account.types';
import { IFinanceCostAccountService } from '@domain/ledger/types/finance-cost.service.types';
import { IGainOnAssetSaleAccountService } from '@domain/ledger/types/gain-on-sale.service.types';
import { IGiftsAccountService } from '@domain/ledger/types/gifts.service.types';
import { IGrantsAccountService } from '@domain/ledger/types/grants.service.types';
import { IInterestAccountService } from '@domain/ledger/types/interest.service.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';
import {
  IStatutoryPayableAccountMeta,
  ITradePayableAccountMeta,
} from '@domain/ledger/types/liability-account.types';
import { IPayablesAccountService } from '@domain/ledger/types/payables.service.types';
import { IReceivablesAccountService } from '@domain/ledger/types/receivables-account.service.types';
import { IRentAndUtilitiesAccountService } from '@domain/ledger/types/rent-and-utilities.service.types';
import { IServicesAccountService } from '@domain/ledger/types/services.service.types';
import { ITaxExpenseAccountService } from '@domain/ledger/types/tax-expense.service.types';
import { IUnrealizedGainAccountService } from '@domain/ledger/types/unrealized-gain.service.types';
import { IUnrealizedLossAccountService } from '@domain/ledger/types/unrealized-loss.service.types';
import currencyEntity from '@domain/money/entities/currency.entity';

import { ILedgerAccountBootstrapResult } from '@app/ledger/contracts/ledger-account-bootstrap.types';
import ILedgerAccountPersistenceService from '@app/ledger/contracts/ledger-account-persistence.service.contract';
import IPostingAccountBootstrapService from '@app/ledger/contracts/posting-account-bootstrap.service.contract';

interface IDependencies {
  ledgerAccountPersistenceService: ILedgerAccountPersistenceService;
  receivablesAccountService: IReceivablesAccountService;
  payablesAccountService: IPayablesAccountService;
  servicesAccountService: IServicesAccountService;
  employmentIncomeAccountService: IEmploymentIncomeAccountService;
  gainOnAssetSaleAccountService: IGainOnAssetSaleAccountService;
  unrealizedGainAccountService: IUnrealizedGainAccountService;
  grantsAccountService: IGrantsAccountService;
  giftsAccountService: IGiftsAccountService;
  directCostsAccountService: IDirectCostsAccountService;
  rentAndUtilitiesAccountService: IRentAndUtilitiesAccountService;
  bankChargeAccountService: IBankChargeAccountService;
  financeCostAccountService: IFinanceCostAccountService;
  interestAccountService: IInterestAccountService;
  taxExpenseAccountService: ITaxExpenseAccountService;
  unrealizedLossAccountService: IUnrealizedLossAccountService;
  assetDisposalLossAccountService: IAssetDisposalLossAccountService;
}

type TAuditedLedgerAccount = TAuditedEntity<
  ILedgerAccount,
  ILedgerAccount,
  ILedgerAccount
>;

export default function makePostingAccountBootstrapService(
  deps: IDependencies
): IPostingAccountBootstrapService {
  const bootstrap: IPostingAccountBootstrapService['bootstrap'] = async (
    accountingEntity,
    repoOptions
  ) => {
    const createdBy = accountingEntity.ownerId;
    const accountingEntityId = accountingEntity.id;
    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );
    const actor = historyValue.getUserActor(createdBy);
    const bootstrapResult: ILedgerAccountBootstrapResult = {
      entries: [],
      events: [],
    };
    const postingPayload = {
      createdBy,
      accountingEntityId,
      isControlAccount: false,
    };
    const persistAccount = async ([
      account,
      events,
      audit,
    ]: TAuditedLedgerAccount) => {
      const history = historyValue.make(
        audit,
        actor,
        repoOptions.correlationId
      );

      await deps.ledgerAccountPersistenceService.create(
        account,
        accountingEntity.functionalCurrencyCode,
        { ...repoOptions, history: [history] }
      );

      bootstrapResult.entries.push({ account, audit });
      bootstrapResult.events.push(...events);
    };

    // ========================================================================
    // ASSET LEDGER POSTING ACCOUNTS
    // ========================================================================

    await persistAccount(
      await deps.receivablesAccountService.createTradeReceivableSubAccount(
        {
          name: 'Trade Receivables',
          userId: createdBy,
          accountingEntity,
          currency: functionalCurrency,
          isControlAccount: true,
          controlAccountCode: ASSET_LEDGER_CODES.RECEIVABLES.HEADER,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.receivablesAccountService.createStatutoryReceivableSubAccount(
        {
          name: 'Statutory Receivables',
          userId: createdBy,
          accountingEntity,
          currency: functionalCurrency,
          isControlAccount: true,
          controlAccountCode: ASSET_LEDGER_CODES.RECEIVABLES.HEADER,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.receivablesAccountService.createStatutoryReceivableSubAccount(
        {
          name: 'Statutory Receivables (Default)',
          userId: createdBy,
          accountingEntity,
          currency: functionalCurrency,
          isControlAccount: false,
          controlAccountCode: ASSET_LEDGER_CODES.RECEIVABLES.STATUTORY,
        },
        repoOptions
      )
    );

    // ========================================================================
    // LIABILITY LEDGER POSTING ACCOUNTS
    // ========================================================================

    await persistAccount(
      await deps.payablesAccountService.createTradePayableSubAccount(
        {
          name: 'Trade Payables',
          createdBy,
          accountingEntity,
          isControlAccount: true,
          controlAccountCode: LIABILITY_LEDGER_CODES.PAYABLES.HEADER,
          meta: null as unknown as ITradePayableAccountMeta,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.payablesAccountService.createStatutoryPayableSubAccount(
        {
          name: 'Statutory Payables',
          createdBy,
          accountingEntity,
          currency: functionalCurrency,
          isControlAccount: true,
          controlAccountCode: LIABILITY_LEDGER_CODES.PAYABLES.HEADER,
          meta: null as unknown as IStatutoryPayableAccountMeta,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.payablesAccountService.createStatutoryPayableSubAccount(
        {
          name: 'Statutory Payables (Default)',
          createdBy,
          accountingEntity,
          currency: functionalCurrency,
          isControlAccount: false,
          controlAccountCode: LIABILITY_LEDGER_CODES.PAYABLES.STATUTORY,
          meta: null as unknown as IStatutoryPayableAccountMeta,
        },
        repoOptions
      )
    );

    // ========================================================================
    // REVENUE LEDGER POSTING ACCOUNTS
    // ========================================================================

    await persistAccount(
      await deps.servicesAccountService.createSubAccount(
        {
          ...postingPayload,
          name: 'Services (Default)',
          controlAccountCode: REVENUE_LEDGER_CODES.SERVICES.HEADER,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.employmentIncomeAccountService.createSubAccount(
        {
          ...postingPayload,
          name: 'Employment Income (Default)',
          controlAccountCode: REVENUE_LEDGER_CODES.EMPLOYMENT_INCOME.HEADER,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.gainOnAssetSaleAccountService.createSubAccount(
        {
          ...postingPayload,
          name: 'Gain on Sale of Assets (Default)',
          controlAccountCode: REVENUE_LEDGER_CODES.GAIN_ON_ASSET_SALE.HEADER,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.unrealizedGainAccountService.createSubAccount(
        {
          ...postingPayload,
          name: 'Unrealized Gains (Default)',
          controlAccountCode: REVENUE_LEDGER_CODES.UNREALIZED_GAINS.HEADER,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.grantsAccountService.createSubAccount(
        {
          ...postingPayload,
          name: 'Grants (Default)',
          controlAccountCode: REVENUE_LEDGER_CODES.GRANTS.HEADER,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.giftsAccountService.createSubAccount(
        {
          ...postingPayload,
          name: 'Gifts (Default)',
          controlAccountCode: REVENUE_LEDGER_CODES.GIFTS.HEADER,
        },
        repoOptions
      )
    );

    // ========================================================================
    // EXPENSE LEDGER POSTING ACCOUNTS
    // ========================================================================

    await persistAccount(
      await deps.directCostsAccountService.createSubAccount(
        {
          ...postingPayload,
          name: 'Direct Costs (Default)',
          behavior: EExpenseAccountBehavior.DefaultDirectCost,
          controlAccountCode: EXPENSE_LEDGER_CODES.DIRECT_COSTS.HEADER,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.rentAndUtilitiesAccountService.createSubAccount(
        {
          ...postingPayload,
          name: 'Rent and Utilities (Default)',
          controlAccountCode: EXPENSE_LEDGER_CODES.RENT_AND_UTILITIES.HEADER,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.bankChargeAccountService.createSubAccount(
        {
          ...postingPayload,
          name: 'Bank Charge (Default)',
          controlAccountCode: EXPENSE_LEDGER_CODES.BANK_CHARGE.HEADER,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.financeCostAccountService.createSubAccount(
        {
          ...postingPayload,
          name: 'Finance Cost (Default)',
          controlAccountCode: EXPENSE_LEDGER_CODES.FINANCE_COST.HEADER,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.interestAccountService.createSubAccount(
        {
          ...postingPayload,
          name: 'Interest (Default)',
          controlAccountCode: EXPENSE_LEDGER_CODES.INTEREST.HEADER,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.taxExpenseAccountService.createSubAccount(
        {
          ...postingPayload,
          name: 'Tax Expense (Default)',
          controlAccountCode: EXPENSE_LEDGER_CODES.TAX_EXPENSE.HEADER,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.unrealizedLossAccountService.createSubAccount(
        {
          ...postingPayload,
          name: 'Unrealized Loss (Default)',
          controlAccountCode: EXPENSE_LEDGER_CODES.UNREALIZED_LOSS.HEADER,
        },
        repoOptions
      )
    );
    await persistAccount(
      await deps.assetDisposalLossAccountService.createSubAccount(
        {
          ...postingPayload,
          name: 'Asset Disposal Loss (Default)',
          controlAccountCode: EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER,
        },
        repoOptions
      )
    );

    return Object.freeze(bootstrapResult);
  };

  return Object.freeze({ bootstrap });
}
