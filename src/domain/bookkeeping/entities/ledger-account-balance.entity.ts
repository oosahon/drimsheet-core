import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { IMoney } from '../../../shared/types/money.types';
import stringUtils from '../../../shared/utils/string';
import generateUUID from '../../../shared/utils/uuid-generator';
import moneyValue from '../../../shared/value-objects/money.vo';
import currencyEntity from '../../currency/entities/currency.entity';
import ledgerAccountEntity from '../../ledger/entities/shared/ledger-account.entity';
import ledgerAccountBalanceError from '../errors/ledger-account-balance.error';
import {
  ILedgerAccountBalance,
  ILedgerAccountBalanceAdjustment,
  INewLedgerAccountBalanceAndAdjustment,
} from '../types/ledger-account-balance.types';
import helpers from './helpers/ledger-account-balance.entity.helpers';

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
  delta: IMoney,
  functionalDelta: IMoney
): ILedgerAccountBalance {
  moneyValue.validate(delta);
  moneyValue.validate(functionalDelta);

  return Object.freeze({
    ledgerAccountId: existingBalance.ledgerAccountId,
    accountingEntityId: existingBalance.accountingEntityId,
    accountMaterializedPath: existingBalance.accountMaterializedPath,
    version: existingBalance.version, // version update delegated to repo implementation
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

  const effect = helpers.getEffectFromAmount(payload.amount);

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

  ...helpers,
});

export default ledgerAccountBalanceEntity;
