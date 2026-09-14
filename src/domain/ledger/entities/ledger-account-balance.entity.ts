import { TCreationOmits } from '@shared/types/creation-omits.types';
import stringUtils from '@shared/utils/string';
import generateUUID from '@shared/utils/uuid-generator';

import getLedgerAccountBalanceEffect from '@domain/ledger/entities/helpers/get-effect-from-amount.helper';
import ledgerAccountBalanceValidation from '@domain/ledger/entities/validations/ledger-account-balance.validation';
import ledgerAccountValidation from '@domain/ledger/entities/validations/ledger-account.validation';
import ledgerAccountBalanceError from '@domain/ledger/errors/ledger-account-balance.error';
import {
  ILedgerAccountBalance,
  ILedgerAccountBalanceAdjustment,
  INewLedgerAccountBalanceAndAdjustment,
} from '@domain/ledger/types/ledger-account-balance.types';
import currencyEntity from '@domain/money/entities/currency.entity';
import { IMoney } from '@domain/money/types/money.types';
import moneyValue from '@domain/money/values/money.vo';

interface IMakePayload extends Pick<
  ILedgerAccountBalance,
  'ledgerAccountId' | 'accountingEntityId' | 'accountMaterializedPath'
> {
  currencyCode: string;
  functionalCurrencyCode: string;
}

function make(payload: IMakePayload): ILedgerAccountBalance {
  stringUtils.validateUUID(
    payload.ledgerAccountId,
    ledgerAccountBalanceError.InvalidLedgerAccountId
  );
  stringUtils.validateUUID(
    payload.accountingEntityId,
    ledgerAccountBalanceError.InvalidAccountingEntityId
  );

  ledgerAccountValidation.validateMaterializedPath(
    payload.accountMaterializedPath
  );

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
  delta: IMoney,
  functionalDelta: IMoney
): ILedgerAccountBalance {
  moneyValue.validate(delta);
  moneyValue.validate(functionalDelta);

  return Object.freeze({
    ledgerAccountId: existingBalance.ledgerAccountId,
    accountingEntityId: existingBalance.accountingEntityId,
    accountMaterializedPath: existingBalance.accountMaterializedPath,
    version: existingBalance.version + 1,
    createdAt: existingBalance.createdAt,

    amount: moneyValue.add(existingBalance.amount, delta),
    functionalAmount: moneyValue.add(
      existingBalance.functionalAmount,
      functionalDelta
    ),
    updatedAt: new Date(),
  });
}

function adjust(
  existingBalance: ILedgerAccountBalance,
  payload: TCreationOmits<ILedgerAccountBalanceAdjustment, 'effect'>
): INewLedgerAccountBalanceAndAdjustment {
  stringUtils.validateUUID(
    payload.ledgerAccountId,
    ledgerAccountBalanceError.InvalidLedgerAccountId
  );
  moneyValue.validate(payload.amount);
  moneyValue.validate(payload.functionalAmount);
  stringUtils.validateUUID(
    payload.journalEntryId,
    ledgerAccountBalanceError.InvalidJournalEntryId
  );

  stringUtils.validateUUID(
    payload.createdBy,
    ledgerAccountBalanceError.InvalidCreatorId
  );

  const effect = getLedgerAccountBalanceEffect(payload.amount);

  const adjustment = Object.freeze({
    id: generateUUID(),
    ledgerAccountId: payload.ledgerAccountId,
    amount: payload.amount,
    functionalAmount: payload.functionalAmount,
    journalEntryId: payload.journalEntryId,
    effect,
    createdBy: payload.createdBy,
    createdAt: new Date(),
  });
  const newBalance = updateBalance(
    existingBalance,
    payload.amount,
    payload.functionalAmount
  );

  const data = Object.freeze({
    adjustment,
    newBalance,
  });

  return data;
}

const ledgerAccountBalanceEntity = Object.freeze({
  make,
  adjust,
  ...ledgerAccountBalanceValidation,
});

export default ledgerAccountBalanceEntity;
