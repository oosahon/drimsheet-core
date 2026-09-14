import { IReadRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';
import { IEvent } from '@shared/values/events/types/event.types';
import historyValue from '@shared/values/history/history.vo';
import { IUserHistoryActor } from '@shared/values/history/types/history.types';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import { ICounterpartyHistory } from '@domain/counterparty/types/counterparty-audit.types';
import { ICounterparty } from '@domain/counterparty/types/counterparty.types';
import { ICreateTransferEntryPayload } from '@domain/journal-entry/types/journal-entry.service.types';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';
import exchangeRateValue from '@domain/money/values/exchange-rate.vo';

import ICounterpartyAppService, {
  ICounterpartyFindOrCreateRes,
} from '@app/counterparty/contracts/counterparty.service.contract';
import { IJournalLineReq } from '@app/journal-entry/dtos/journal-entry/journal-entry.dto';
import { ITransferEntryReq } from '@app/journal-entry/dtos/transfer-entry/transfer-entry.dto';
import ledgerAppError from '@app/ledger/errors/ledger.error';
import moneyMapper from '@app/money/dtos/money/money.dto.mapper';

interface IGetNewCounterpartiesResult {
  counterparties: [ICounterparty, ICounterpartyHistory][];
  events: IEvent<ICounterparty>[][];
}

async function getChargeAccounts(
  chargeLines: IJournalLineReq[],
  accountingEntity: IAccountingEntity,
  repo: ILedgerAccountRepo,
  repoOptions: IReadRepoOptions
) {
  const chargeAccounts: ILedgerAccount[] = [];

  for (const chargeLine of chargeLines) {
    const chargeAccount = await repo.findById(
      chargeLine.accountId as TEntityId,
      accountingEntity.id,
      repoOptions
    );

    if (!chargeAccount) {
      throw new ledgerAppError.AccountNotFound({
        id: chargeLine.accountId,
      });
    }

    chargeAccounts.push(chargeAccount);
  }

  return chargeAccounts;
}

function transformChargeLineToJournalLine(
  payload: ITransferEntryReq,
  counterparties: Map<string, ICounterpartyFindOrCreateRes>,
  chargeAccounts: ILedgerAccount[],
  counterpartyAppService: ICounterpartyAppService
): ICreateTransferEntryPayload['destinationLines'] {
  return payload.chargeLines.map((chargeLine, index) => {
    const counterparty = chargeLine.counterparty
      ? (counterpartyAppService.getFoundOrCreated(
          chargeLine.counterparty,
          counterparties
        )?.data[0] ?? null)
      : null;

    return {
      account: chargeAccounts[index],
      counterparty,
      sequenceOrder: chargeLine.sequenceOrder,
      amount: moneyMapper.fromDto(chargeLine.amount),
      exchangeRate: chargeLine.exchangeRate
        ? exchangeRateValue.make(chargeLine.exchangeRate)
        : null,
      description: chargeLine.description,
      meta: null,
    };
  });
}

function getSourceLinePayload(
  payload: ITransferEntryReq,
  sourceAccount: ILedgerAccount
): ICreateTransferEntryPayload['sourceLine'] {
  const sourceExchangeRate = payload.sourceLine.exchangeRate
    ? exchangeRateValue.make(payload.sourceLine.exchangeRate)
    : null;

  return {
    account: sourceAccount,
    sequenceOrder: payload.sourceLine.sequenceOrder,
    amount: moneyMapper.fromDto(payload.sourceLine.amount),
    exchangeRate: sourceExchangeRate,
    description: payload.sourceLine.description,
    meta: null,
  };
}

function getDestinationPayload(
  payload: ITransferEntryReq,
  account: ILedgerAccount
): ICreateTransferEntryPayload['destinationLines'][number] {
  return {
    account,
    counterparty: null,
    sequenceOrder: payload.destinationLine.sequenceOrder,
    amount: moneyMapper.fromDto(payload.destinationLine.amount),
    exchangeRate: payload.destinationLine.exchangeRate
      ? exchangeRateValue.make(payload.destinationLine.exchangeRate)
      : null,
    description: payload.destinationLine.description,
    meta: null,
  };
}

function getNewCounterparties(
  allCounterparties: Map<string, ICounterpartyFindOrCreateRes>,
  userActor: IUserHistoryActor,
  correlationId: string
): IGetNewCounterpartiesResult {
  const counterparties: [ICounterparty, ICounterpartyHistory][] = [];
  const events: IEvent<ICounterparty>[][] = [];

  for (const foundOrCreatedCounterparty of allCounterparties.values()) {
    if (!foundOrCreatedCounterparty.new) continue;

    const [counterparty, newEvent, audit] = foundOrCreatedCounterparty.data;
    const history = historyValue.make(audit, userActor, correlationId);
    counterparties.push([counterparty, history]);
    events.push(newEvent);
  }

  return {
    counterparties,
    events,
  };
}

const createTransferUseCaseHelpers = Object.freeze({
  getSourceLinePayload,
  getDestinationPayload,
  getNewCounterparties,
  getChargeAccounts,
  transformChargeLineToJournalLine,
});

export default createTransferUseCaseHelpers;
