import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import { TRentUtilitiesLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IRentUtilitiesAccount,
} from '../types/expense-account.types';
import helpers from './helpers/rent-and-utilities.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TRentUtilitiesLedgerCode;
  precedingCode: TRentUtilitiesLedgerCode;
}

function make(
  payload: Pick<
    IRentUtilitiesAccount,
    | 'name'
    | 'createdBy'
    | 'accountingEntityId'
    | 'currency'
    | 'isControlAccount'
    | 'controlAccountId'
    | 'meta'
  >,
  parent: IParentDetails | null
): TAuditedEntity<
  IRentUtilitiesAccount,
  IRentUtilitiesAccount,
  ILedgerAccount
> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const [account, events, audit] =
    ledgerAccountEntity.make<IRentUtilitiesAccount>({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Expense),
      type: ELedgerType.Expense,
      subType: EExpenseSubType.RentAndUtilities,
      behavior: EExpenseAccountBehavior.RentAndUtilities,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      currency: payload.currency,
      meta: payload.meta,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.createdBy,
    });

  return [account, events, audit];
}

function makeHeader(
  payload: Pick<
    IRentUtilitiesAccount,
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
      meta: null,
    },
    null
  );
}

const rentAndUtilitiesAccountEntity = Object.freeze({
  make,
  makeHeader,
  ...helpers,
});

export default rentAndUtilitiesAccountEntity;
