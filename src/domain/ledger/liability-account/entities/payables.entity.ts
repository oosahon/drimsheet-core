import stringUtils from '../../../../shared/utils/string';
import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import ledgerAccountError from '../../errors/ledger-account.error';
import { TPayablesLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
  IPayableAccount,
  IStatutoryPayableAccount,
  IStatutoryPayableAccountMeta,
  ITradePayableAccount,
  ITradePayableAccountMeta,
} from '../types/liability-account.types';
import helpers from './helpers/payables.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TPayablesLedgerCode;
  precedingCode: TPayablesLedgerCode;
}

/**
 * Creates a new payable header/sub account.
 * @param payload payable account creation payload
 * @param parent the ledger code of the most recent Payable account.
 * @returns [IPayableAccount, IPayableCreationEvent]
 */
function make(
  payload: Pick<
    IPayableAccount,
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
): TAuditedEntity<IPayableAccount, IPayableAccount, ILedgerAccount> {
  if (payload.controlAccountId) {
    stringUtils.validateUUID(
      payload.controlAccountId,
      ledgerAccountError.InvalidControlAccountId
    );
  }

  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const [account, events, audit] = ledgerAccountEntity.make<IPayableAccount>({
    name: payload.name,
    accountingEntityId: payload.accountingEntityId,

    code,
    materializedPath,
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Liability),
    type: ELedgerType.Liability,
    subType: ELiabilitySubType.Payable,
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

  return [account, events, audit];
}

function makeHeader(
  payload: Pick<
    IPayableAccount,
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
      behavior: ELiabilityAccountBehavior.DefaultPayable,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      meta: null,
    },
    null
  );
}

function makeStatutoryPayableAccountMeta(
  meta: IStatutoryPayableAccountMeta | null
): IStatutoryPayableAccountMeta | null {
  if (!meta) return null;

  const taxAuthority = stringUtils.sanitizeAndValidate(
    meta.taxAuthority,
    {
      min: 2,
      max: 100,
    },
    ledgerAccountError.InvalidTaxAuthority
  );

  const taxType = stringUtils.sanitizeAndValidate(
    meta.taxType,
    {
      min: 2,
      max: 50,
    },
    ledgerAccountError.InvalidTaxType
  );

  return Object.freeze<IStatutoryPayableAccountMeta>({
    taxAuthority,
    taxType,
  });
}

/**
 * Creates a new statutory payable sub account.
 * @param payload statutory payable creation payload
 * @param parent the ledger code of the most recent Payable account.
 * @returns [IPayableAccount, IPayableCreationEvent]
 */
function makeStatutoryPayableAccount(
  payload: Pick<
    IStatutoryPayableAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TAuditedEntity<IPayableAccount, IPayableAccount, ILedgerAccount> {
  return make(
    {
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      currency: payload.currency,
      createdBy: payload.createdBy,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      behavior: ELiabilityAccountBehavior.TaxPayable,
      meta: makeStatutoryPayableAccountMeta(payload.meta),
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    },
    parent
  );
}

function makeTradePayableAccountMeta(
  meta: ITradePayableAccountMeta | null
): ITradePayableAccountMeta | null {
  if (!meta) return null;

  stringUtils.validateUUID(
    meta.counterpartyId,
    ledgerAccountError.InvalidCounterpartyId
  );
  stringUtils.validateUUID(meta.invoiceId, ledgerAccountError.InvalidInvoiceId);

  return Object.freeze<ITradePayableAccountMeta>({
    counterpartyId: meta.counterpartyId,
    invoiceId: meta.invoiceId,
  });
}

/**
 * Creates a new trade payable sub account.
 * @param payload trade payable creation payload
 * @param parent the ledger code of the most recent Payable account.
 * @returns [IPayableAccount, IPayableCreationEvent]
 */
function makeTradePayableAccount(
  payload: Pick<
    ITradePayableAccount,
    | 'name'
    | 'accountingEntityId'
    | 'currency'
    | 'createdBy'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TAuditedEntity<IPayableAccount, IPayableAccount, ILedgerAccount> {
  return make(
    {
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      currency: payload.currency,
      createdBy: payload.createdBy,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      behavior: ELiabilityAccountBehavior.TradePayable,
      meta: makeTradePayableAccountMeta(payload.meta),
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
    },
    parent
  );
}

const payableAccountEntity = Object.freeze({
  make,
  makeHeader,

  makeStatutoryPayableAccountMeta,
  makeStatutoryPayableAccount,

  makeTradePayableAccountMeta,
  makeTradePayableAccount,

  ...helpers,
});

export default payableAccountEntity;
