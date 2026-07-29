import IAccountingPeriodService from '../../../domain/accounting/types/accounting-period.service.types';
import assetAccountError from '../../../domain/ledger/asset-account/errors/asset-account.error';
import IBankAccountRepo from '../../../domain/ledger/asset-account/repos/bank-account.repo';
import IAssetAccountService from '../../../domain/ledger/asset-account/types/asset-account.service.types';
import { ICashAndCashEquivalentAccount } from '../../../domain/ledger/asset-account/types/asset-account.types';
import bankAccountValue from '../../../domain/ledger/asset-account/values/bank.vo';
import { TCashLedgerCode } from '../../../domain/ledger/shared/types/ledger-code.types';
import currencyEntity from '../../../domain/money/entities/currency.entity';
import IFxCostBasisLotDomainService from '../../../domain/subledger/fx-cost-basis/types/lot.service.types';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import eventValue from '../../../shared/events/event.vo';
import historyValue from '../../../shared/history/history.vo';
import {
  ERepoLock,
  IReadRepoOptions,
  IRepoOptions,
} from '../../../shared/types/repo.types';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IAppContext from '../../context/contracts/app-context.contract';
import IJournalEntryPersistenceService from '../../journal-entry/contracts/journal-entry-persistence.service.contract';
import IOpeningBalanceEntryService from '../../journal-entry/contracts/opening-balance-entry.service.contract';
import IExchangeRateAppService from '../../money/contracts/exchange-rate.service.contract';
import IFxCostBasisPersistenceService from '../../subledger/fx-cost-basis/contracts/fx-cost-basis-persistence.service.contract';
import { ILedgerAccountBalancePropagationService } from '../contracts/ledger-account-balance-propagation.service.contract';
import ILedgerAccountPersistenceService from '../contracts/ledger-account-persistence.service.contract';
import { IBankAccountCreationReq } from '../dtos/asset-account/asset-account.dto';
import { bankAccountCreationReqValidation } from '../dtos/asset-account/asset-account.dto.validation';
import { ILedgerAccountDto } from '../dtos/ledger-account/ledger-account.dto';
import mapLedgerAccountToDto from './helpers/map-ledger-account-to-dto.helper';
import prepareOpeningBalanceForAccountCreation from './helpers/prepare-opening-balance-for-account-creation.helper';
import validateOpeningBalanceExchangeRate from './helpers/validate-opening-balance-exchange-rate.helper';

interface IDependencies {
  appContext: IAppContext;
  eventBus: IEventBus;
  accountingPeriodService: IAccountingPeriodService;
  assetAccountService: IAssetAccountService;
  bankAccountRepo: IBankAccountRepo;
  openingBalanceEntryService: IOpeningBalanceEntryService;
  journalEntryPersistenceService: IJournalEntryPersistenceService;
  balancePropagationService: ILedgerAccountBalancePropagationService;
  repoService: IRepoService;
  ledgerAccountPersistenceService: ILedgerAccountPersistenceService;
  fxCostBasisPersistenceService: IFxCostBasisPersistenceService;
  fxCostBasisService: IFxCostBasisLotDomainService;
  exchangeRateService: IExchangeRateAppService;
}

export default function makeCreateBankAccountUseCase(deps: IDependencies) {
  return async (
    payload: IBankAccountCreationReq
  ): Promise<ILedgerAccountDto> => {
    zodValidationRunner(bankAccountCreationReqValidation, payload);

    const { correlationId, user, accountingEntity } = deps.appContext.get();

    const bankVal = bankAccountValue.make({
      countryCode: accountingEntity.jurisdictionCode,
      bankName: payload.bankAccount.bankName,
      accountName: payload.bankAccount.accountName,
      accountNumber: payload.bankAccount.accountNumber,
    });

    validateOpeningBalanceExchangeRate(
      accountingEntity.functionalCurrencyCode,
      payload.currencyCode,
      payload.openingBalance
    );

    const trace = { correlationId };
    const actor = historyValue.getUserActor(user.id);

    const checkPreconditions = async (repoOptions: IReadRepoOptions) => {
      const existing = await deps.bankAccountRepo.findOne(
        bankVal.bankName,
        bankVal.accountNumber,
        repoOptions
      );

      if (existing) {
        throw new assetAccountError.DuplicateBankAccount({
          bankName: bankVal.bankName,
          accountNumber: bankVal.accountNumber,
        });
      }

      if (payload.openingBalance) {
        await deps.accountingPeriodService.validatePostingPeriod(
          accountingEntity.id,
          payload.openingBalance.date,
          { ...repoOptions, lock: ERepoLock.Share }
        );
      }
    };

    const makeAccountCreation = async (repoOptions: IReadRepoOptions) => {
      const [account, events, audit] =
        await deps.assetAccountService.makeBankSubAccount(
          {
            name: payload.name,
            currency: currencyEntity.getByCode(payload.currencyCode),
            userId: user.id,
            accountingEntity,
            controlAccountCode: payload.controlAccountCode as TCashLedgerCode,
            bankValue: bankVal,
          },
          { ...repoOptions, lock: ERepoLock.Update }
        );

      return {
        account,
        events,
        history: [historyValue.make(audit, actor, correlationId)],
      };
    };

    const prepareCreation = async (repoOptions: IReadRepoOptions) => {
      await checkPreconditions(repoOptions);

      const accountCreation = await makeAccountCreation(repoOptions);

      if (!payload.openingBalance) {
        return {
          account: accountCreation.account as ICashAndCashEquivalentAccount,
          accountHistory: accountCreation.history,
          journalEntry: null,
          events: accountCreation.events,
          openingBalanceResult: null,
        };
      }

      const openingBalanceResult =
        await prepareOpeningBalanceForAccountCreation(
          {
            openingBalanceEntryService: deps.openingBalanceEntryService,
            fxCostBasisService: deps.fxCostBasisService,
            exchangeRateService: deps.exchangeRateService,
          },
          {
            accountingEntity,
            account: accountCreation.account,
            initialHistory: accountCreation.history,
            initialEvents: accountCreation.events,
            openingBalance: payload.openingBalance,
            actor,
            correlationId,
            repoOptions,
          }
        );

      return {
        account: openingBalanceResult.account as ICashAndCashEquivalentAccount,
        accountHistory: openingBalanceResult.accountHistory,
        journalEntry: openingBalanceResult.journalEntry,
        events: openingBalanceResult.events,
        openingBalanceResult,
      };
    };

    const persistCreation = async (
      creation: Awaited<ReturnType<typeof prepareCreation>>,
      repoOptions: IRepoOptions
    ) => {
      await deps.ledgerAccountPersistenceService.create(
        creation.account,
        accountingEntity.functionalCurrencyCode,
        { ...repoOptions, history: creation.accountHistory }
      );

      await deps.bankAccountRepo.create(
        creation.account.id,
        accountingEntity.id,
        bankVal,
        { ...repoOptions, history: null }
      );

      if (creation.openingBalanceResult?.journalEntryPersistence) {
        const { journalEntry, headerHistory, lineHistories } =
          creation.openingBalanceResult.journalEntryPersistence;

        await deps.journalEntryPersistenceService.create(
          journalEntry,
          headerHistory,
          lineHistories,
          repoOptions
        );
      }

      if (creation.openingBalanceResult?.fxAcquisitionPersistence) {
        const { lot, acquisition, lotHistory, acquisitionHistory } =
          creation.openingBalanceResult.fxAcquisitionPersistence;

        await deps.fxCostBasisPersistenceService.persistAcquisition(
          lot,
          acquisition,
          lotHistory,
          acquisitionHistory,
          repoOptions
        );
      }
    };

    const transactionFn: TRepoTransactionFn<
      Awaited<ReturnType<typeof prepareCreation>>
    > = async (tx) => {
      const repoOptions = { ...trace, tx };
      const creation = await prepareCreation(repoOptions);

      await persistCreation(creation, repoOptions);

      return creation;
    };

    const creation = await deps.repoService.runInTransaction(transactionFn);

    if (creation.journalEntry) {
      await deps.balancePropagationService.propagate(
        creation.journalEntry,
        trace
      );
    }

    await deps.eventBus.publish(eventValue.enrichAll(creation.events, trace));

    return mapLedgerAccountToDto(
      creation.account,
      creation.journalEntry,
      accountingEntity.functionalCurrencyCode
    );
  };
}
