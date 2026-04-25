import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import { AppError } from '../../../shared/value-objects/error';
import moneyValue from '../../../shared/value-objects/money.vo';
import currencyEntity from '../../currency/entities/currency.entity';
import ledgerAccountEntity from '../../ledger/entities/shared/ledger-account.entity';
import {
  ELedgerAccountBalanceEffect,
  ILedgerAccountBalance,
  ILedgerAccountBalanceAdjustment,
  ULedgerAccountBalanceEffect,
} from '../types/ledger-account-balance.types';

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

function validateEffect(effect: ULedgerAccountBalanceEffect) {
  if (!Object.values(ELedgerAccountBalanceEffect).includes(effect)) {
    throw new AppError(`Invalid effect balance effect`, { cause: effect });
  }
}

function makeAdjustment(
  payload: TCreationOmits<ILedgerAccountBalanceAdjustment>
): ILedgerAccountBalanceAdjustment {
  stringUtils.validateUUID(payload.ledgerAccountId);
  moneyValue.validate(payload.amount);
  moneyValue.validate(payload.functionalAmount);
  stringUtils.validateUUID(payload.journalEntryId);
  if (payload.transactionId) stringUtils.validateUUID(payload.transactionId);
  stringUtils.validateUUID(payload.createdBy);
  validateEffect(payload.effect);

  return Object.freeze({
    id: generateUUID(),
    ledgerAccountId: payload.ledgerAccountId,
    amount: payload.amount,
    functionalAmount: payload.functionalAmount,
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
