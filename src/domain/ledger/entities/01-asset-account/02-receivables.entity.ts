import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import { TEntityWithEvents } from '../../../../shared/types/event.types';
import { AppError } from '../../../../shared/value-objects/error';
import stringUtils from '../../../../shared/utils/string';
import assetAccountEvents from '../../events/asset-account.events';
import {
  EAssetAccountBehavior,
  EAssetSubType,
  IReceivablesAccount,
  IStatutoryReceivableAccount,
  ITradeReceivableAccount,
} from '../../types/asset-account.types';
import { ETaxType } from '../../types/tax.types';
import { TReceivablesLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';

function getCode(
  predecessorCode: TReceivablesLedgerCode
): TReceivablesLedgerCode {
  return ledgerAccountEntity.getSubLedgerCode<TReceivablesLedgerCode>(
    '102',
    predecessorCode
  );
}

/**
 * Creates a new receivable account.
 * @param payload receivable account creation payload
 * @param predecessorCode the ledger code of the most recent Receivable sub ledger.
 * @returns [IReceivablesAccount, IAssetLedgerCreationEvent]
 */
function make(
  payload: Pick<
    IReceivablesAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'behavior'
    | 'meta'
    | 'contraAccountRule'
    | 'adjunctAccountRule'
  >,
  predecessorCode: TReceivablesLedgerCode | null // null for the root receivable account
): TEntityWithEvents<IReceivablesAccount, IReceivablesAccount> {
  if (payload.controlAccountId) {
    stringUtils.validateUUID(payload.controlAccountId);
  }

  const account = ledgerAccountEntity.make<IReceivablesAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,
    code: predecessorCode ? getCode(predecessorCode) : '102000',
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Asset),
    type: ELedgerType.Asset,
    subType: EAssetSubType.Receivables,
    behavior: payload.behavior,
    isControlAccount: payload.isControlAccount,
    controlAccountId: payload.controlAccountId,
    currency: payload.currency,
    meta: payload.meta,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: payload.contraAccountRule,
    adjunctAccountRule: payload.adjunctAccountRule,
    createdBy: payload.createdBy,
  });

  const event = assetAccountEvents.receivablesCreated(account);
  return [account, [event]];
}

/**
 * Creates a new statutory receivable sub ledger.
 * @param payload statutory receivable creation payload
 * @param predecessorCode the ledger code of the most recent Receivable sub ledger.
 * @returns [IReceivablesAccount, IAssetLedgerCreationEvent]
 */
function makeStatutoryReceivableAccount(
  payload: Pick<
    IStatutoryReceivableAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
  >,
  predecessorCode: TReceivablesLedgerCode
): TEntityWithEvents<IReceivablesAccount, IReceivablesAccount> {
  return make(
    {
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,
      currency: payload.currency,
      createdBy: payload.createdBy,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      behavior: EAssetAccountBehavior.StatutoryReceivable,
      meta: null,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    },
    predecessorCode
  );
}

/**
 * Creates a new trade receivable sub ledger.
 * @param payload trade receivable creation payload
 * @param predecessorCode the ledger code of the most recent Receivable sub ledger.
 * @returns [IReceivablesAccount, IAssetLedgerCreationEvent]
 */
function makeTradeReceivableAccount(
  payload: Pick<
    ITradeReceivableAccount,
    | 'name'
    | 'accountingEntityId'
    | 'currency'
    | 'createdBy'
    | 'isControlAccount'
    | 'controlAccountId'
  >,
  predecessorCode: TReceivablesLedgerCode | null
): TEntityWithEvents<IReceivablesAccount, IReceivablesAccount> {
  return make(
    {
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,
      currency: payload.currency,
      createdBy: payload.createdBy,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      behavior: EAssetAccountBehavior.TradeReceivable,
      meta: null,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
    },
    predecessorCode
  );
}

const receivablesAccountEntity = Object.freeze({
  make,

  makeStatutoryReceivableAccount,

  makeTradeReceivableAccount,

  getCode,
});

export default receivablesAccountEntity;
