import { TAuditedEntity } from '../../../../shared/types/event.types';
import revenueAccountEvents from '../../events/revenue-account.events';
import { TEmploymentIncomeLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
  IEmploymentIncomeAccount,
} from '../../types/revenue-account.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';
import helpers from './helpers/employment-income.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TEmploymentIncomeLedgerCode;
  precedingCode: TEmploymentIncomeLedgerCode;
}

function make(
  payload: Pick<
    IEmploymentIncomeAccount,
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
  IEmploymentIncomeAccount,
  IEmploymentIncomeAccount,
  ILedgerAccount
> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const [account, [ledgerAccountCreatedEvent], audit] =
    ledgerAccountEntity.make<IEmploymentIncomeAccount>({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      code,
      materializedPath,
      type: ELedgerType.Revenue,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Revenue),
      subType: ERevenueSubType.EmploymentIncome,
      behavior: ERevenueAccountBehavior.EmploymentIncome,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId,
      currency: payload.currency,
      meta: payload.meta,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.createdBy,
    });

  const event = revenueAccountEvents.employmentIncomeCreated(account);
  return [account, [ledgerAccountCreatedEvent, event], audit];
}

function makeHeader(
  payload: Pick<
    IEmploymentIncomeAccount,
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

const employmentIncomeAccountEntity = Object.freeze({
  make,
  makeHeader,
  ...helpers,
});

export default employmentIncomeAccountEntity;
