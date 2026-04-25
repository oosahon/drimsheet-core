import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { IMoney } from '../../../shared/types/money.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import moneyValue from '../../../shared/value-objects/money.vo';
import currencyEntity from '../../currency/entities/currency.entity';
import ledgerAccountEntity from '../../ledger/entities/shared/ledger-account.entity';
import {
  ILedgerAccountBalance,
  ILedgerAccountBalanceAdjustment,
  INewLedgerAccountBalanceAndAdjustment,
} from '../types/ledger-account-balance.types';
import ledgerAccountBalanceEvents from './events/ledger-account-balance.events';
import helpers from './helpers/ledger-account-balance.entity.helpers';

interface IMakePayload extends Pick<
  ILedgerAccountBalance,
  'ledgerAccountId' | 'accountingEntityId' | 'accountMaterializedPath'
> {
  currencyCode: string;
  functionalCurrencyCode: string;
}

function make(payload: IMakePayload): ILedgerAccountBalance {
  stringUtils.validateUUID(payload.ledgerAccountId);
  stringUtils.validateUUID(payload.accountingEntityId);
  ledgerAccountEntity.validateMaterializedPath(payload.accountMaterializedPath);

  const baseCurrency = currencyEntity.getByCode(payload.currencyCode);
  const functionalCurrency = currencyEntity.getByCode(
    payload.functionalCurrencyCode
  );

  const amount = moneyValue.makeZeroAmount(baseCurrency);
  const functionalAmount = moneyValue.makeZeroAmount(functionalCurrency);

  const timestamp = new Date();

  return Object.freeze({
    ledgerAccountId: payload.ledgerAccountId,
    accountingEntityId: payload.accountingEntityId,
    accountMaterializedPath: payload.accountMaterializedPath,
    amount,
    functionalAmount,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

function updateBalance(
  existingBalance: ILedgerAccountBalance,
  delta: IMoney
): ILedgerAccountBalance {
  moneyValue.validate(delta);

  return Object.freeze({
    ...existingBalance,
    version: existingBalance.version + 1,
    amount: moneyValue.add(existingBalance.amount, delta),
    updatedAt: new Date(),
  });
}

function makeAdjustment(
  existingBalance: ILedgerAccountBalance,
  payload: TCreationOmits<ILedgerAccountBalanceAdjustment, 'effect'>
): TEntityWithEvents<
  INewLedgerAccountBalanceAndAdjustment,
  INewLedgerAccountBalanceAndAdjustment
> {
  stringUtils.validateUUID(payload.ledgerAccountId);
  moneyValue.validate(payload.amount);
  moneyValue.validate(payload.functionalAmount);
  stringUtils.validateUUID(payload.journalEntryId);
  if (payload.transactionId) stringUtils.validateUUID(payload.transactionId);
  stringUtils.validateUUID(payload.createdBy);

  const effect = helpers.getEffectFromAmount(payload.amount);

  const adjustment = Object.freeze({
    id: generateUUID(),
    ledgerAccountId: payload.ledgerAccountId,
    amount: payload.amount,
    functionalAmount: payload.functionalAmount,
    journalEntryId: payload.journalEntryId,
    transactionId: payload.transactionId,
    effect,
    createdBy: payload.createdBy,
    createdAt: new Date(),
  });
  const newBalance = updateBalance(existingBalance, payload.amount);

  const data = Object.freeze({
    adjustment,
    newBalance,
  });

  const event = ledgerAccountBalanceEvents.makeAdjusted(data);

  return [data, [event]];
}

const ledgerAccountBalanceEntity = Object.freeze({
  make,
  makeAdjustment,

  ...helpers,
});

export default ledgerAccountBalanceEntity;
