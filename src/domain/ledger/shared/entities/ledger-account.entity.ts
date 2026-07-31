import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import dateUtils from '../../../../shared/utils/date';
import stringUtils from '../../../../shared/utils/string';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import currencyEntity from '../../../money/entities/currency.entity';
import ledgerAccountError from '../errors/ledger-account.error';
import ledgerError from '../errors/ledger.error';
import ledgerAccountEvents from '../events/ledger-account.events';
import { ELedgerAccountAuditAction } from '../types/ledger-account-audit.types';
import { ILedgerAccount } from '../types/ledger.types';
import ledgerAccountAudit from '../values/ledger-account-audit.vo';
import helpers from './helpers/ledger-account.entity.helpers';

function make<T extends ILedgerAccount>(
  payload: TCreationOmits<T, 'openingBalanceDate'>
): TAuditedEntity<Readonly<T>, T, ILedgerAccount> {
  helpers.validateCode(payload.code);
  stringUtils.validateUUID(
    payload.accountingEntityId,
    ledgerError.InvalidValue
  );
  helpers.validateType(payload.type);

  if (payload.controlAccountId) {
    stringUtils.validateUUID(
      payload.controlAccountId,
      ledgerError.InvalidValue
    );
  }

  currencyEntity.validateCode(payload.currency.code);
  helpers.validateStatus(payload.status);

  helpers.validateContraRule(payload.contraAccountRule);
  helpers.validateAdjunctRule(payload.adjunctAccountRule);
  stringUtils.validateUUID(payload.createdBy, ledgerError.InvalidValue);

  helpers.validateSubType(payload.subType);
  helpers.validateBehavior(payload.behavior);
  helpers.validateNormalBalance(payload.normalBalance);

  helpers.validateIsControlAccount(payload.isControlAccount);
  helpers.validateMeta(payload.meta);
  helpers.validateMaterializedPath(payload.materializedPath);

  const timestamp = new Date();

  const ledgerAccount: ILedgerAccount = {
    id: generateUUID(),
    code: payload.code,
    accountingEntityId: payload.accountingEntityId,
    type: payload.type,
    materializedPath: payload.materializedPath,
    normalBalance: payload.normalBalance,
    subType: payload.subType,
    behavior: payload.behavior,
    isControlAccount: !!payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    name: stringUtils.sanitizeAndValidate(
      payload.name,
      { min: 2, max: 100 },
      ledgerError.InvalidValue
    ),
    currency: payload.currency,
    status: payload.status,
    contraAccountRule: payload.contraAccountRule,
    adjunctAccountRule: payload.adjunctAccountRule,
    // Proper meta validation is delegated to the specific ledger account entity
    meta: payload.meta,
    openingBalanceDate: null,
    createdBy: payload.createdBy,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };

  const entity = Object.freeze(ledgerAccount) as Readonly<T>;

  const event = ledgerAccountEvents.makeCreated(entity);

  const audit = ledgerAccountAudit.make({
    before: null,
    after: ledgerAccount,
    action: ELedgerAccountAuditAction.Created,
  });

  return [entity, [event], audit];
}

function updateOpeningBalanceDate<T extends ILedgerAccount>(
  account: T,
  openingBalanceDate: Date
): TAuditedEntity<Readonly<T>, T, ILedgerAccount> {
  dateUtils.validateDateIsNotInTheFuture(
    openingBalanceDate,
    ledgerAccountError.InvalidOpeningBalanceDate
  );

  if (account.isControlAccount) {
    throw new ledgerAccountError.ForbiddenControlAccountOpeningBalanceDate();
  }

  if (account.openingBalanceDate !== null) {
    throw new ledgerAccountError.OpeningBalanceDateAlreadySet();
  }

  const timestamp = new Date();

  const updatedAccount: T = {
    id: account.id,
    code: account.code,
    materializedPath: account.materializedPath,
    accountingEntityId: account.accountingEntityId,
    type: account.type,
    normalBalance: account.normalBalance,
    subType: account.subType,
    behavior: account.behavior,
    isControlAccount: account.isControlAccount,
    controlAccountId: account.controlAccountId,
    name: account.name,
    currency: account.currency,
    status: account.status,
    contraAccountRule: account.contraAccountRule,
    adjunctAccountRule: account.adjunctAccountRule,
    meta: account.meta,
    openingBalanceDate,
    createdBy: account.createdBy,
    createdAt: account.createdAt,
    updatedAt: timestamp,
    deletedAt: account.deletedAt,
  } as T;

  const entity = Object.freeze(updatedAccount);

  const event = ledgerAccountEvents.updated(entity);

  const audit = ledgerAccountAudit.make({
    before: account,
    after: updatedAccount,
    action: ELedgerAccountAuditAction.Updated,
  });

  return [entity, [event], audit];
}

const ledgerAccountEntity = Object.freeze({
  make,
  updateOpeningBalanceDate,

  ...helpers,
});

export default ledgerAccountEntity;
