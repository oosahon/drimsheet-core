import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import ledgerAccountEntity from '../../shared/entities/ledger-account.entity';
import { TOpeningBalanceEquityLedgerCode } from '../../shared/types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../shared/types/ledger.types';
import equityAccountEvents from '../events/equity-account.events';
import {
  EEquityAccountBehavior,
  EEquitySubType,
  IOpeningBalanceEquityAccount,
} from '../types/equity-account.types';
import helpers from './helpers/opening-balance.entity.helpers';

interface IParentDetails {
  parentMaterializedPath: TOpeningBalanceEquityLedgerCode;
  precedingCode: TOpeningBalanceEquityLedgerCode;
}

function make(
  payload: Pick<
    IOpeningBalanceEquityAccount,
    'name' | 'createdBy' | 'accountingEntityId' | 'currency'
  >,
  parent: IParentDetails | null
): TAuditedEntity<
  IOpeningBalanceEquityAccount,
  IOpeningBalanceEquityAccount,
  ILedgerAccount
> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const [account, [ledgerAccountCreatedEvent], audit] =
    ledgerAccountEntity.make<IOpeningBalanceEquityAccount>({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Equity),
      type: ELedgerType.Equity,
      subType: EEquitySubType.OpeningBalance,
      behavior: EEquityAccountBehavior.OpeningBalanceEquity,
      isControlAccount: false,
      controlAccountId: null,
      currency: payload.currency,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.createdBy,
    });

  const event = equityAccountEvents.openingBalanceEquityCreated(account);
  return [account, [ledgerAccountCreatedEvent, event], audit];
}

const openingBalanceEquityLedgerEntity = Object.freeze({
  make,
  ...helpers,
});

export default openingBalanceEquityLedgerEntity;
