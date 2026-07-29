import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import {
  IJournalEntryHistory,
  IJournalLineHistory,
} from '../../../../domain/journal-entry/types/journal-entry-audit.types';
import { IJournalEntry } from '../../../../domain/journal-entry/types/journal-entry.types';
import ledgerAccountEntity from '../../../../domain/ledger/shared/entities/ledger-account.entity';
import { ILedgerAccountHistory } from '../../../../domain/ledger/shared/types/ledger-account-audit.types';
import { ILedgerAccount } from '../../../../domain/ledger/shared/types/ledger.types';
import { IExchangeRate } from '../../../../domain/money/types/exchange-rate.types';
import {
  IFxCostBasisLotAcquisition,
  IFxCostBasisLotAcquisitionHistory,
} from '../../../../domain/subledger/fx-cost-basis/types/acquisition.types';
import IFxCostBasisLotDomainService from '../../../../domain/subledger/fx-cost-basis/types/lot.service.types';
import {
  IFxCostBasisLot,
  IFxCostBasisLotHistory,
} from '../../../../domain/subledger/fx-cost-basis/types/lot.types';
import { IEvent } from '../../../../shared/events/types/event.types';
import historyValue from '../../../../shared/history/history.vo';
import { IHistoryActor } from '../../../../shared/history/types/history.types';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import IOpeningBalanceEntryService from '../../../journal-entry/contracts/opening-balance-entry.service.contract';
import { IOpeningBalanceDto } from '../../../journal-entry/dtos/opening-balance/opening-balance.dto';
import IExchangeRateAppService from '../../../money/contracts/exchange-rate.service.contract';
import moneyMapper from '../../../money/dtos/money/money.dto.mapper';
import getOpeningBalanceExchangeRate from './get-opening-balance-exchange-rate.helper';

export interface IJournalEntryPersistenceData {
  journalEntry: IJournalEntry;
  headerHistory: IJournalEntryHistory;
  lineHistories: IJournalLineHistory[];
}

export interface IFxAcquisitionPersistenceData {
  lot: IFxCostBasisLot;
  acquisition: IFxCostBasisLotAcquisition;
  lotHistory: IFxCostBasisLotHistory;
  acquisitionHistory: IFxCostBasisLotAcquisitionHistory;
}

export interface IPreparedOpeningBalanceResult {
  account: ILedgerAccount;
  accountHistory: ILedgerAccountHistory[];
  journalEntry: IJournalEntry;
  journalEntryPersistence: IJournalEntryPersistenceData;
  fxAcquisitionPersistence: IFxAcquisitionPersistenceData | null;
  events: IEvent<unknown>[];
}

interface IPrepareDeps {
  openingBalanceEntryService: IOpeningBalanceEntryService;
  fxCostBasisService: IFxCostBasisLotDomainService;
  exchangeRateService: IExchangeRateAppService;
}

interface IPrepareParams {
  accountingEntity: IAccountingEntity;
  account: ILedgerAccount;
  initialHistory: ILedgerAccountHistory[];
  initialEvents: IEvent<unknown>[];
  openingBalance: IOpeningBalanceDto;
  actor: IHistoryActor;
  correlationId: string;
  repoOptions: IReadRepoOptions;
}

interface IFxAcquisitionPayload {
  account: ILedgerAccount;
  journalEntry: IJournalEntry;
  exchangeRate: IExchangeRate | null;
  functionalCurrencyCode: string;
  actor: IHistoryActor;
  correlationId: string;
  repoOptions: IReadRepoOptions;
}

async function prepareFxAcquisition(
  deps: IPrepareDeps,
  payload: IFxAcquisitionPayload
) {
  const {
    account,
    journalEntry,
    exchangeRate,
    functionalCurrencyCode,
    actor,
    correlationId,
    repoOptions,
  } = payload;

  const shouldNotCreate =
    !exchangeRate || account.currency.code === functionalCurrencyCode;

  if (shouldNotCreate) {
    return { persistence: null, events: [] };
  }

  const debitLine = journalEntry.lines.find((v) => v.accountId === account.id)!;

  const officialRate = await deps.exchangeRateService.getOfficialRate(
    exchangeRate.currencyPair,
    exchangeRate.asOf,
    repoOptions,
    exchangeRate
  );

  const fxLotData = deps.fxCostBasisService.acquire({
    ledgerAccountId: account.id,
    accountingEntityId: account.accountingEntityId,
    journalEntryId: journalEntry.id,
    quantity: debitLine.amount,
    costBasis: debitLine.functionalAmount,
    acquisitionRate: exchangeRate,
    acquisitionDate: journalEntry.effectiveDate,
    officialRate,
  });

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
}

export default async function prepareOpeningBalanceForAccountCreation(
  deps: IPrepareDeps,
  params: IPrepareParams
): Promise<IPreparedOpeningBalanceResult> {
  const {
    accountingEntity,
    account,
    initialHistory,
    initialEvents,
    openingBalance,
    actor,
    correlationId,
    repoOptions,
  } = params;

  const exchangeRate = getOpeningBalanceExchangeRate(openingBalance);

  const [journalEntry, journalEvents, journalAudit] =
    await deps.openingBalanceEntryService.create(
      accountingEntity,
      account,
      moneyMapper.fromDto(openingBalance.amount),
      openingBalance.date,
      exchangeRate,
      repoOptions
    );

  const [updatedAccount, accountUpdateEvents, accountUpdateAudit] =
    ledgerAccountEntity.updateOpeningBalanceDate(account, openingBalance.date);

  const fxAcquisition = await prepareFxAcquisition(deps, {
    account: updatedAccount,
    journalEntry,
    exchangeRate,
    functionalCurrencyCode: accountingEntity.functionalCurrencyCode,
    actor,
    correlationId,
    repoOptions,
  });

  return {
    account: updatedAccount,
    accountHistory: [
      ...initialHistory,
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
      ...initialEvents,
      ...accountUpdateEvents,
      ...journalEvents,
      ...fxAcquisition.events,
    ],
  };
}
