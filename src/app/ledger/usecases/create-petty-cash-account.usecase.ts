import IAccountingPeriodService from '../../../domain/accounting/types/accounting-period.service.types';
import {
  IJournalEntryHistory,
  IJournalLineHistory,
} from '../../../domain/journal-entry/types/journal-entry-audit.types';
import { IJournalEntry } from '../../../domain/journal-entry/types/journal-entry.types';
import IAssetAccountService from '../../../domain/ledger/asset-account/types/asset-account.service.types';
import { ICashAndCashEquivalentAccount } from '../../../domain/ledger/asset-account/types/asset-account.types';
import ledgerAccountEntity from '../../../domain/ledger/shared/entities/ledger-account.entity';
import { ILedgerAccountHistory } from '../../../domain/ledger/shared/types/ledger-account-audit.types';
import { TCashLedgerCode } from '../../../domain/ledger/shared/types/ledger-code.types';
import { ILedgerAccount } from '../../../domain/ledger/shared/types/ledger.types';
import currencyEntity from '../../../domain/money/entities/currency.entity';
import { IExchangeRate } from '../../../domain/money/types/exchange-rate.types';
import exchangeRateValue from '../../../domain/money/values/exchange-rate.vo';
import moneyValue from '../../../domain/money/values/money.vo';
import {
  IFxCostBasisLotAcquisition,
  IFxCostBasisLotAcquisitionHistory,
} from '../../../domain/subledger/fx-cost-basis/types/acquisition.types';
import IFxCostBasisLotDomainService from '../../../domain/subledger/fx-cost-basis/types/lot.service.types';
import {
  IFxCostBasisLot,
  IFxCostBasisLotHistory,
} from '../../../domain/subledger/fx-cost-basis/types/lot.types';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import eventValue from '../../../shared/events/event.vo';
import { IEvent } from '../../../shared/events/types/event.types';
import historyValue from '../../../shared/history/history.vo';
import {
  ERepoLock,
  IReadRepoOptions,
  IRepoOptions,
} from '../../../shared/types/repo.types';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IAppContext from '../../_internal/contracts/app-context.contract';
import IJournalEntryPersistenceService from '../../bookkeeping/contracts/journal-entry-persistence.service.contract';
import { ILedgerAccountBalancePropagationService } from '../../bookkeeping/contracts/ledger-account-balance-adjustment-service.contract';
import IOpeningBalanceEntryService from '../../bookkeeping/contracts/opening-balance-entry.service.contract';
import { IOpeningBalanceDto } from '../../journal-entry/dtos/opening-balance/opening-balance.dto';
import IExchangeRateAppService from '../../money/contracts/exchange-rate.service.contract';
import moneyMapper from '../../money/dtos/money/money.dto.mapper';
import IFxCostBasisPersistenceService from '../../subledger/fx-cost-basis/contracts/fx-cost-basis-persistence.service.contract';
import ILedgerAccountPersistenceService from '../contracts/ledger-account-persistence.service.contract';
import { IPettyCashAccountCreationReq } from '../dtos/asset-account/asset-account.dto';
import { pettyCashCreationReqValidation } from '../dtos/asset-account/asset-account.dto.validation';
import { ILedgerAccountDto } from '../dtos/ledger-account/ledger-account.dto';
import ledgerAccountMapper from '../dtos/ledger-account/ledger-account.dto.mapper';
import ledgerAppError from '../errors/ledger.error';

interface IDependencies {
  appContext: IAppContext;
  eventBus: IEventBus;
  accountingPeriodService: IAccountingPeriodService;
  assetAccountService: IAssetAccountService;
  openingBalanceEntryService: IOpeningBalanceEntryService;
  journalEntryPersistenceService: IJournalEntryPersistenceService;
  balancePropagationService: ILedgerAccountBalancePropagationService;
  repoService: IRepoService;
  ledgerAccountPersistenceService: ILedgerAccountPersistenceService;
  fxCostBasisPersistenceService: IFxCostBasisPersistenceService;
  fxCostBasisService: IFxCostBasisLotDomainService;
  exchangeRateService: IExchangeRateAppService;
}

interface ITransactionResult {
  account: ICashAndCashEquivalentAccount;
  journalEntry: IJournalEntry | null;
  events: IEvent<unknown>[];
}

interface IJournalEntryPersistenceData {
  journalEntry: IJournalEntry;
  headerHistory: IJournalEntryHistory;
  lineHistories: IJournalLineHistory[];
}

interface IFxAcquisitionPersistenceData {
  lot: IFxCostBasisLot;
  acquisition: IFxCostBasisLotAcquisition;
  lotHistory: IFxCostBasisLotHistory;
  acquisitionHistory: IFxCostBasisLotAcquisitionHistory;
}

interface IPreparedCreation extends ITransactionResult {
  accountHistory: ILedgerAccountHistory[];
  journalEntryPersistence: IJournalEntryPersistenceData | null;
  fxAcquisitionPersistence: IFxAcquisitionPersistenceData | null;
}

const validateExchangeRate = (
  functionalCurrencyCode: string,
  currencyCode: string,
  openingBalance: IOpeningBalanceDto | null
) => {
  const isForex = functionalCurrencyCode !== currencyCode;

  const requiresExchangeRate = isForex && openingBalance;

  if (requiresExchangeRate && !openingBalance?.exchangeRate) {
    throw new ledgerAppError.ExchangeRateRequired({ openingBalance });
  }
};

export default function makeCreatePettyCashAccountUseCase(deps: IDependencies) {
  return async (
    payload: IPettyCashAccountCreationReq
  ): Promise<ILedgerAccountDto> => {
    zodValidationRunner(pettyCashCreationReqValidation, payload);

    const { correlationId, user, accountingEntity } = deps.appContext.get();

    validateExchangeRate(
      accountingEntity.functionalCurrencyCode,
      payload.currencyCode,
      payload.openingBalance
    );

    // FX lot data getter
    const getFxLotData = async (
      account: ILedgerAccount,
      journalEntry: IJournalEntry,
      exchangeRate: IExchangeRate | null,
      repoOptions: IReadRepoOptions
    ) => {
      const shouldNotCreate =
        !exchangeRate ||
        payload.currencyCode === accountingEntity.functionalCurrencyCode;

      if (shouldNotCreate) {
        return null;
      }

      const debitLine = journalEntry.lines.find(
        (v) => v.accountId === account.id
      )!;

      const officialRate = await deps.exchangeRateService.getOfficialRate(
        exchangeRate.currencyPair,
        exchangeRate.asOf,
        repoOptions,
        exchangeRate
      );

      return deps.fxCostBasisService.acquire({
        ledgerAccountId: account.id,
        accountingEntityId: account.accountingEntityId,
        journalEntryId: journalEntry.id,
        quantity: debitLine.amount,
        costBasis: debitLine.functionalAmount,
        acquisitionRate: exchangeRate,
        acquisitionDate: journalEntry.effectiveDate,
        officialRate,
      });
    };

    const getAccountPayload = () => {
      return {
        name: payload.name,
        currency: currencyEntity.getByCode(payload.currencyCode),
        isControlAccount: payload.isControlAccount,
        userId: user.id,
        accountingEntity,
        controlAccountCode: payload.controlAccountCode as TCashLedgerCode,
      };
    };

    const getExchangeRate = () => {
      return payload.openingBalance?.exchangeRate
        ? exchangeRateValue.make(payload.openingBalance.exchangeRate)
        : null;
    };

    const trace = { correlationId };
    const actor = historyValue.getUserActor(user.id);

    const makeAccountCreation = async (repoOptions: IReadRepoOptions) => {
      const [account, events, audit] =
        await deps.assetAccountService.makePettyCashSubAccount(
          getAccountPayload(),
          { ...repoOptions, lock: ERepoLock.Update }
        );

      return {
        account,
        events,
        history: [historyValue.make(audit, actor, correlationId)],
      };
    };

    const makeFxAcquisitionPersistence = async (
      account: ILedgerAccount,
      journalEntry: IJournalEntry,
      exchangeRate: IExchangeRate | null,
      repoOptions: IReadRepoOptions
    ) => {
      const fxLotData = await getFxLotData(
        account,
        journalEntry,
        exchangeRate,
        repoOptions
      );

      if (!fxLotData) {
        return { persistence: null, events: [] };
      }

      const {
        lot: [lot, lotEvents, lotAudit],
        acquisition: [acquisition, acquisitionEvents, acquisitionAudit],
      } = fxLotData;

      return {
        persistence: {
          lot,
          acquisition,
          lotHistory: historyValue.make(lotAudit, actor, correlationId),
          acquisitionHistory: historyValue.make(
            acquisitionAudit,
            actor,
            correlationId
          ),
        },
        events: [...lotEvents, ...acquisitionEvents],
      };
    };

    const prepareOpeningBalanceCreation = async (
      accountCreation: Awaited<ReturnType<typeof makeAccountCreation>>,
      openingBalance: IOpeningBalanceDto,
      repoOptions: IReadRepoOptions
    ): Promise<IPreparedCreation> => {
      const exchangeRate = getExchangeRate();
      const [journalEntry, journalEvents, journalAudit] =
        await deps.openingBalanceEntryService.create(
          accountingEntity,
          accountCreation.account,
          moneyMapper.fromDto(openingBalance.amount),
          openingBalance.date,
          exchangeRate,
          repoOptions
        );

      const [updatedAccount, accountUpdateEvents, accountUpdateAudit] =
        ledgerAccountEntity.updateOpeningBalanceDate(
          accountCreation.account,
          openingBalance.date
        );
      const fxAcquisition = await makeFxAcquisitionPersistence(
        updatedAccount,
        journalEntry,
        exchangeRate,
        repoOptions
      );

      return {
        account: updatedAccount,
        accountHistory: [
          ...accountCreation.history,
          historyValue.make(accountUpdateAudit, actor, correlationId),
        ],
        journalEntry,
        journalEntryPersistence: {
          journalEntry,
          headerHistory: historyValue.make(
            journalAudit.header,
            actor,
            correlationId
          ),
          lineHistories: journalAudit.lines.map((lineAudit) =>
            historyValue.make(lineAudit, actor, correlationId)
          ),
        },
        fxAcquisitionPersistence: fxAcquisition.persistence,
        events: [
          ...accountCreation.events,
          ...accountUpdateEvents,
          ...journalEvents,
          ...fxAcquisition.events,
        ],
      };
    };

    const prepareCreation = async (
      repoOptions: IReadRepoOptions
    ): Promise<IPreparedCreation> => {
      if (payload.openingBalance) {
        await deps.accountingPeriodService.validatePostingPeriod(
          accountingEntity.id,
          payload.openingBalance.date,
          { ...repoOptions, lock: ERepoLock.Share }
        );
      }

      const accountCreation = await makeAccountCreation(repoOptions);

      if (!payload.openingBalance) {
        return {
          account: accountCreation.account,
          accountHistory: accountCreation.history,
          journalEntry: null,
          journalEntryPersistence: null,
          fxAcquisitionPersistence: null,
          events: accountCreation.events,
        };
      }

      return prepareOpeningBalanceCreation(
        accountCreation,
        payload.openingBalance,
        repoOptions
      );
    };

    const persistCreation = async (
      creation: IPreparedCreation,
      repoOptions: IRepoOptions
    ) => {
      await deps.ledgerAccountPersistenceService.create(
        creation.account,
        accountingEntity.functionalCurrencyCode,
        { ...repoOptions, history: creation.accountHistory }
      );

      if (creation.journalEntryPersistence) {
        const { journalEntry, headerHistory, lineHistories } =
          creation.journalEntryPersistence;

        await deps.journalEntryPersistenceService.create(
          journalEntry,
          headerHistory,
          lineHistories,
          repoOptions
        );
      }

      if (creation.fxAcquisitionPersistence) {
        const { lot, acquisition, lotHistory, acquisitionHistory } =
          creation.fxAcquisitionPersistence;

        await deps.fxCostBasisPersistenceService.persistAcquisition(
          lot,
          acquisition,
          lotHistory,
          acquisitionHistory,
          repoOptions
        );
      }
    };

    const transactionFn: TRepoTransactionFn<ITransactionResult> = async (
      tx
    ) => {
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

    const accountLine = creation.journalEntry?.lines.find(
      (line) => line.accountId === creation.account.id
    );
    const balance =
      accountLine?.amount ??
      moneyValue.makeZeroAmount(creation.account.currency);
    const functionalBalance =
      accountLine?.functionalAmount ??
      moneyValue.makeZeroAmount(
        currencyEntity.getByCode(accountingEntity.functionalCurrencyCode)
      );

    return ledgerAccountMapper.toDto(
      creation.account,
      balance,
      functionalBalance
    );
  };
}
