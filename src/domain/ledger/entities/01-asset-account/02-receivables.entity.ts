import { TEntityWithEvents } from '../../../../shared/types/event.types';
import stringUtils from '../../../../shared/utils/string';
import ledgerError from '../../errors/ledger.error';
import assetAccountEvents from '../../events/asset-account.events';
import ledgerAccountEvents from '../../events/ledger-account.events';
import {
  EAssetAccountBehavior,
  EAssetSubType,
  IReceivablesAccount,
  IStatutoryReceivableAccount,
  ITradeReceivableAccount,
} from '../../types/asset-account.types';
import { TReceivablesLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';
import helpers from './helpers/receivables.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TReceivablesLedgerCode;
  precedingCode: TReceivablesLedgerCode;
}

/**
 * Creates a new receivable header/sub account.
 * @param payload receivable account creation payload
 * @param parent the ledger details of the most recent Receivables account.
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
  parent: IParentDetails | null // null for the header account
): TEntityWithEvents<IReceivablesAccount, IReceivablesAccount> {
  if (payload.controlAccountId) {
    stringUtils.validateUUID(
      payload.controlAccountId,
      ledgerError.InvalidValue
    );
  }

  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const account = ledgerAccountEntity.make<IReceivablesAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,

    code,
    materializedPath,
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
  const ledgerAccountCreatedEvent = ledgerAccountEvents.makeCreated(account);
  return [account, [ledgerAccountCreatedEvent, event]];
}

function makeHeader(
  payload: Pick<
    IReceivablesAccount,
    'name' | 'createdBy' | 'accountingEntityId' | 'currency'
  >
) {
  return make(
    {
      name: payload.name,
      createdBy: payload.createdBy,
      accountingEntityId: payload.accountingEntityId,
      currency: payload.currency,
      isControlAccount: true,
      controlAccountId: null,
      behavior: EAssetAccountBehavior.DefaultReceivables,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      meta: null,
    },
    null
  );
}

/**
 * Creates a new statutory receivable sub account.
 * @param payload statutory receivable creation payload
 * @param parent the ledger details of the most recent Receivables account.
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
  parent: IParentDetails | null
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
    parent
  );
}

/**
 * Creates a new trade receivable sub account.
 * @param payload trade receivable creation payload
 * @param parent the ledger details of the most recent Receivables account.
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
  parent: IParentDetails | null
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
    parent
  );
}

const receivablesAccountEntity = Object.freeze({
  make,
  makeHeader,
  makeStatutoryReceivableAccount,
  makeTradeReceivableAccount,

  ...helpers,
});

export default receivablesAccountEntity;
