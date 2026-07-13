import { IJournalEntry } from '../../../domain/journal-entry/types/journal-entry.types';
import IAssetAccountService from '../../../domain/ledger/asset-account/types/asset-account.service.types';
import { ICashAndCashEquivalentAccount } from '../../../domain/ledger/asset-account/types/asset-account.types';
import ILedgerAccountPersistenceService from '../../../domain/ledger/shared/types/ledger-account-persistence.service.types';
import { TCashLedgerCode } from '../../../domain/ledger/shared/types/ledger-code.types';
import { ILedgerAccount } from '../../../domain/ledger/shared/types/ledger.types';
import currencyEntity from '../../../domain/money/entities/currency.entity';
import { IExchangeRate } from '../../../domain/money/types/exchange-rate.types';
import exchangeRateValue from '../../../domain/money/value-objects/exchange-rate.vo';
import { IFxCostBasisLotAcquisition } from '../../../domain/subledger/fx-cost-basis/types/acquisition.types';
import IFxCostBasisLotDomainService from '../../../domain/subledger/fx-cost-basis/types/lot.service.types';
import { IFxCostBasisLot } from '../../../domain/subledger/fx-cost-basis/types/lot.types';
import IAppContext from '../../../shared/contracts/app-context.contract';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import { IEvent } from '../../../shared/types/event.types';
import { IReadRepoOptions } from '../../../shared/types/repo.types';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import historyValue from '../../../shared/value-objects/history.vo';
import IJournalEntryPersistenceService from '../../bookkeeping/contracts/journal-entry-persistence.service.contract';
import IOpeningBalanceEntryService from '../../bookkeeping/contracts/opening-balance-entry.service.contract';
import { IOpeningBalanceDto } from '../../journal-entry/dtos/opening-balance/opening-balance.dto';
import IExchangeRateAppService from '../../money/contracts/exchange-rate.service.contract';
import moneyMapper from '../../money/dtos/money/money.dto.mapper';
import IFxCostBasisPersistenceService from '../../subledger/fx-cost-basis/contracts/fx-cost-basis-persistence.service.contract';
import { IPettyCashAccountCreationReq } from '../dtos/asset-account/asset-account.dto';
import { pettyCashCreationReqValidation } from '../dtos/asset-account/asset-account.dto.validation';
import ledgerAppError from '../errors/ledger.error';

interface IDependencies {
  appContext: IAppContext;
  eventBus: IEventBus;
  assetAccountService: IAssetAccountService;
  openingBalanceEntryService: IOpeningBalanceEntryService;
  journalEntryPersistenceService: IJournalEntryPersistenceService;
  repoService: IRepoService;
  ledgerAccountPersistenceService: ILedgerAccountPersistenceService;
  fxCostBasisPersistenceService: IFxCostBasisPersistenceService;
  fxCostBasisService: IFxCostBasisLotDomainService;
  exchangeRateService: IExchangeRateAppService;
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
  ): Promise<ICashAndCashEquivalentAccount> => {
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

    const [account, accountEvents, accountAudit] =
      await deps.assetAccountService.makePettyCashSubAccount(
        getAccountPayload(),
        trace
      );

    const actor = historyValue.getUserActor(user.id);
    const accountHistory = [
      historyValue.make(accountAudit, actor, correlationId),
    ];

    if (!payload.openingBalance) {
      const repoOptions = {
        ...trace,
        history: accountHistory,
      };

      await deps.ledgerAccountPersistenceService.create(
        account,
        accountingEntity.functionalCurrencyCode,
        repoOptions
      );

      deps.eventBus.publish(eventValue.enrichAll(accountEvents, trace));

      return account;
    }

    // Create the opening balance journal entry
    const exchangeRate = getExchangeRate();

    const [journalEntry, journalEvents, audit] =
      await deps.openingBalanceEntryService.create(
        accountingEntity,
        account,
        moneyMapper.fromDto(payload.openingBalance.amount),
        exchangeRate,
        trace
      );

    const fxLotData = await getFxLotData(
      account,
      journalEntry,
      exchangeRate,
      trace
    );

    let lotEvents: IEvent<IFxCostBasisLot>[] = [];
    let acquisitionEvents: IEvent<IFxCostBasisLotAcquisition>[] = [];

    // Persistence
    const dbTransactionFn: TRepoTransactionFn = async (tx) => {
      const repoOptions = { ...trace, tx };

      await deps.ledgerAccountPersistenceService.create(
        account,
        accountingEntity.functionalCurrencyCode,
        {
          ...repoOptions,
          history: accountHistory,
        }
      );

      const headerHistory = historyValue.make(
        audit.header,
        actor,
        correlationId
      );
      const linesHistory = audit.lines.map((lineAudit) =>
        historyValue.make(lineAudit, actor, correlationId)
      );
      await deps.journalEntryPersistenceService.create(
        journalEntry,
        headerHistory,
        linesHistory,
        repoOptions
      );

      if (fxLotData) {
        const {
          lot: [lot, lotEventData, lotHistory],
          acquisition: [acquisition, acqEventData, acquisitionHistory],
        } = fxLotData;

        await deps.fxCostBasisPersistenceService.persistAcquisition(
          lot,
          acquisition,
          historyValue.make(lotHistory, actor, correlationId),
          historyValue.make(acquisitionHistory, actor, correlationId),
          repoOptions
        );

        lotEvents = lotEventData;
        acquisitionEvents = acqEventData;
      }
    };

    await deps.repoService.runInTransaction(dbTransactionFn);

    const allEvents: IEvent<unknown>[] = [
      ...accountEvents,
      ...journalEvents,
      ...lotEvents,
      ...acquisitionEvents,
    ];
    deps.eventBus.publish(eventValue.enrichAll(allEvents, trace));

    return account;
  };
}
