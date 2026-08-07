import { TAuditedEntity } from '../../../../shared/values/events/types/event.types';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
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
  ILedgerAccount,
} from '../../types/ledger.types';
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

  const [account, events, audit] =
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

  return [account, events, audit];
}

const openingBalanceEquityLedgerEntity = Object.freeze({
  make,
  ...helpers,
});

export default openingBalanceEquityLedgerEntity;
