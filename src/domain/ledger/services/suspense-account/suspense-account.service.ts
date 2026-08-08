import { ASSET_LEDGER_CODES } from '../../config/asset-codes.config';
import { LIABILITY_LEDGER_CODES } from '../../config/liability-codes.config';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import ILedgerAccountRepo from '../../repos/ledger-account.repo';
import {
  EAssetAccountBehavior,
  EAssetSubType,
} from '../../types/asset-account.types';
import {
  TAssetSuspenseLedgerCode,
  TLiabilitySuspenseLedgerCode,
} from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../types/ledger.types';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
} from '../../types/liability-account.types';
import { ISuspenseAccountService } from '../../types/suspense-account.service.types';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}

function makeCreateAssetSuspense(
  deps: IDependencies
): ISuspenseAccountService['createAssetSuspense'] {
  return async (payload, repoOptions) => {
    const latest = await deps.ledgerAccountRepo.findLatestBySubType(
      payload.accountingEntityId,
      ELedgerType.Asset,
      EAssetSubType.Suspense,
      repoOptions
    );

    const code = !latest
      ? ASSET_LEDGER_CODES.SUSPENSE_ACCOUNT.INITIAL
      : ledgerAccountEntity.getSubLedgerCode(
          ASSET_LEDGER_CODES.SUSPENSE_ACCOUNT.PREFIX,
          latest.code as TAssetSuspenseLedgerCode
        );

    return ledgerAccountEntity.make({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Asset),
      code,
      materializedPath: code,
      type: ELedgerType.Asset,
      subType: EAssetSubType.Suspense,
      behavior: EAssetAccountBehavior.Default,
      meta: null,
      isControlAccount: false,
      controlAccountId: null,
      currency: payload.currency,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.createdBy,
    });
  };
}

function makeCreateLiabilitySuspense(
  deps: IDependencies
): ISuspenseAccountService['createLiabilitySuspense'] {
  return async (payload, repoOptions) => {
    const latest = await deps.ledgerAccountRepo.findLatestBySubType(
      payload.accountingEntityId,
      ELedgerType.Liability,
      ELiabilitySubType.Suspense,
      repoOptions
    );

    const code = !latest
      ? LIABILITY_LEDGER_CODES.SUSPENSE_ACCOUNTS.INITIAL
      : ledgerAccountEntity.getSubLedgerCode(
          LIABILITY_LEDGER_CODES.SUSPENSE_ACCOUNTS.PREFIX,
          latest.code as TLiabilitySuspenseLedgerCode
        );

    return ledgerAccountEntity.make({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,

      normalBalance: ledgerAccountEntity.getNormalBalance(
        ELedgerType.Liability
      ),
      code,
      materializedPath: code,
      type: ELedgerType.Liability,
      subType: ELiabilitySubType.Suspense,
      behavior: ELiabilityAccountBehavior.Default,
      meta: null,
      isControlAccount: false,
      controlAccountId: null,
      currency: payload.currency,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.createdBy,
    });
  };
}

export default function makeSuspenseAccountService(deps: IDependencies) {
  const service: ISuspenseAccountService = {
    createAssetSuspense: makeCreateAssetSuspense(deps),
    createLiabilitySuspense: makeCreateLiabilitySuspense(deps),
  };

  return Object.freeze(service);
}
