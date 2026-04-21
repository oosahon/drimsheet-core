import { TEntityWithEvents } from '../../../../shared/types/event.types';
import equityAccountEvents from '../../events/equity-account.events';
import ledgerAccountEvents from '../../events/ledger-account.events';
import {
  EEquityAccountBehavior,
  EEquitySubType,
  IOpeningBalanceEquityAccount,
} from '../../types/equity-account.types';
import { TOpeningBalanceEquityLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';
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
): TEntityWithEvents<
  IOpeningBalanceEquityAccount,
  IOpeningBalanceEquityAccount
> {
  const code = helpers.getCode(parent?.precedingCode ?? null);
  const materializedPath = helpers.getMaterializedPath(
    code,
    parent?.parentMaterializedPath ?? null
  );

  const account = ledgerAccountEntity.make<IOpeningBalanceEquityAccount>({
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
  const ledgerAccountCreatedEvent = ledgerAccountEvents.makeCreated(account);
  return [account, [ledgerAccountCreatedEvent, event]];
}

const openingBalanceEquityLedgerEntity = Object.freeze({
  make,
  ...helpers,
});

export default openingBalanceEquityLedgerEntity;
