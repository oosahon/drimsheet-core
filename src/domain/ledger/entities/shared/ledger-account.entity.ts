import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import stringUtils from '../../../../shared/utils/string';
import generateUUID from '../../../../shared/utils/uuid-generator';
import currencyEntity from '../../../currency/entities/currency.entity';
import ledgerError from '../../errors/ledger.error';
import { ILedgerAccount } from '../../types/ledger.types';
import helpers from './helpers/ledger-account.entity.helpers';

function make<T extends ILedgerAccount>(
  payload: TCreationOmits<T>
): Readonly<T> {
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
    createdBy: payload.createdBy,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  };

  return Object.freeze(ledgerAccount) as Readonly<T>;
}

const ledgerAccountEntity = Object.freeze({
  make,

  ...helpers,
});

export default ledgerAccountEntity;
