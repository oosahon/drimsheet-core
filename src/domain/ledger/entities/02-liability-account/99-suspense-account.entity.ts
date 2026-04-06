import { TEntityWithEvents } from '../../../../shared/types/event.types';
import liabilityAccountEvents from '../../events/liability-account.events';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
  ILiabilitySuspenseAccount,
} from '../../types/liability-account.types';
import { TLiabilitySuspenseLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import ledgerAccountEntity from '../shared/ledger-account.entity';

function getCode(predecessorCode: TLiabilitySuspenseLedgerCode) {
  return ledgerAccountEntity.getSubLedgerCode<TLiabilitySuspenseLedgerCode>(
    '299',
    predecessorCode
  );
}

function make(
  payload: Pick<
    ILiabilitySuspenseAccount,
    'name' | 'createdBy' | 'accountingEntityId' | 'currency'
  >,
  predecessorCode: TLiabilitySuspenseLedgerCode
): TEntityWithEvents<ILiabilitySuspenseAccount, ILiabilitySuspenseAccount> {
  const { name, createdBy, accountingEntityId, currency } = payload;

  const account = ledgerAccountEntity.make<ILiabilitySuspenseAccount>({
    name,
    accountingEntityId,
    code: getCode(predecessorCode),
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Liability),
    type: ELedgerType.Liability,
    subType: ELiabilitySubType.Suspense,
    behavior: ELiabilityAccountBehavior.Default,
    meta: null,
    isControlAccount: false,
    controlAccountId: null,
    currency,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraNotPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
    createdBy,
  });
  const event = liabilityAccountEvents.suspenseCreated(account);
  return [account, [event]];
}

const liabilitySuspenseAccountEntity = Object.freeze({
  make,
  getCode,
});

export default liabilitySuspenseAccountEntity;
