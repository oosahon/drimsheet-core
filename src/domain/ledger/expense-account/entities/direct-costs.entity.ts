import stringUtils from '../../../../shared/utils/string';
import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import ledgerAccountEntity from '../../shared/entities/ledger-account.entity';
import ledgerError from '../../shared/errors/ledger.error';
import { TDirectCostsLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
import expenseAccountEvents from '../events/expense-account.events';
import {
  EExpenseSubType,
  IDirectCostsAccount,
} from '../types/expense-account.types';
import helpers from './helpers/direct-costs.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TDirectCostsLedgerCode;
  precedingCode: TDirectCostsLedgerCode;
}

function make(
  payload: Pick<
    IDirectCostsAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'behavior'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TAuditedEntity<IDirectCostsAccount, IDirectCostsAccount, ILedgerAccount> {
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

  const [account, [ledgerAccountCreatedEvent], audit] =
    ledgerAccountEntity.make<IDirectCostsAccount>({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Expense),
      type: ELedgerType.Expense,
      subType: EExpenseSubType.DirectCosts,
      behavior: payload.behavior,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      currency: payload.currency,
      meta: payload.meta,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.createdBy,
    });

  const event = expenseAccountEvents.directCostsCreated(account);
  return [account, [ledgerAccountCreatedEvent, event], audit];
}

function makeHeader(
  payload: Pick<
    IDirectCostsAccount,
    'name' | 'createdBy' | 'accountingEntityId' | 'currency' | 'behavior'
  >
) {
  return make(
    {
      name: payload.name,
      createdBy: payload.createdBy,
      accountingEntityId: payload.accountingEntityId,
      currency: payload.currency,
      behavior: payload.behavior,
      isControlAccount: true,
      controlAccountId: null,
      meta: null,
    },
    null
  );
}

const directCostsAccountEntity = Object.freeze({
  make,
  makeHeader,
  ...helpers,
});

export default directCostsAccountEntity;
