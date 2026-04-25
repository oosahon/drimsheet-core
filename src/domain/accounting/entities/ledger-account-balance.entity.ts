import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import numberUtils from '../../../shared/utils/number';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import { AppError } from '../../../shared/value-objects/error';
import currencyEntity from '../../currency/entities/currency.entity';
import {
  EBalanceEffect,
  ILedgerAccountBalance,
  ILedgerAccountBalanceAdjustment,
  UBalanceEffect,
} from '../types/ledger-account-balance.types';

function make(
  payload: TCreationOmits<ILedgerAccountBalance, 'amount'>
): ILedgerAccountBalance {
  stringUtils.validateUUID(payload.ledgerAccountId);
  currencyEntity.validateCode(payload.currencyCode);

  const timestamp = new Date();

  return Object.freeze({
    ledgerAccountId: payload.ledgerAccountId,
    currencyCode: payload.currencyCode,
    amount: 0,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

function validateEffect(effect: UBalanceEffect) {
  if (!Object.values(EBalanceEffect).includes(effect)) {
    throw new AppError(`Invalid effect balance effect`, { cause: effect });
  }
}

function makeAdjustment(
  payload: TCreationOmits<ILedgerAccountBalanceAdjustment>
): ILedgerAccountBalanceAdjustment {
  stringUtils.validateUUID(payload.ledgerAccountId);
  currencyEntity.validateCode(payload.currencyCode);
  stringUtils.validateUUID(payload.journalEntryId);
  if (payload.transactionId) stringUtils.validateUUID(payload.transactionId);
  stringUtils.validateUUID(payload.createdBy);
  numberUtils.validateNonNegativeNumber(payload.amount);
  validateEffect(payload.effect);

  return Object.freeze({
    id: generateUUID(),
    ledgerAccountId: payload.ledgerAccountId,
    currencyCode: payload.currencyCode,
    amount: payload.amount,
    journalEntryId: payload.journalEntryId,
    transactionId: payload.transactionId,
    effect: payload.effect,
    createdBy: payload.createdBy,
    createdAt: new Date(),
  });
}

const ledgerAccountBalanceEntity = Object.freeze({
  make,
  makeAdjustment,
});

export default ledgerAccountBalanceEntity;
