import currencyEntity from '../../../money/entities/currency.entity';
import { ASSET_LEDGER_CODES } from '../../config/asset-codes.config';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import ledgerAccountError from '../../errors/ledger-account.error';
import ILedgerAccountRepo from '../../repos/ledger-account.repo';
import {
  EAssetAccountBehavior,
  EAssetSubType,
} from '../../types/asset-account.types';
import { TReceivablesLedgerCode } from '../../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../types/ledger.types';
import { IReceivablesAccountService } from '../../types/receivables-account.service.types';
import controlAccountResolverHelper from '../helpers/control-account-resolver';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}

const LEDGER_CODE = ASSET_LEDGER_CODES.RECEIVABLES;

/**
 *
 * Creates a statutory receivable header account
 *
 * @param deps IDependencies
 * @returns Audited IReceivablesAccount
 *
 */
function makeCreateHeader(
  deps: IDependencies
): IReceivablesAccountService['createHeader'] {
  return async (payload, repoOptions) => {
    const existingHeader = await deps.ledgerAccountRepo.findByCode(
      LEDGER_CODE.HEADER,
      payload.accountingEntity.id,
      repoOptions
    );

    if (existingHeader) {
      throw new ledgerAccountError.HeaderAccountAlreadyExists({
        existingHeader,
      });
    }

    const currency = currencyEntity.getByCode(
      payload.accountingEntity.functionalCurrencyCode
    );

    return ledgerAccountEntity.make({
      name: payload.name,
      accountingEntityId: payload.accountingEntity.id,
      code: LEDGER_CODE.HEADER,
      materializedPath: LEDGER_CODE.HEADER,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Asset),
      type: ELedgerType.Asset,
      subType: EAssetSubType.Receivables,
      behavior: EAssetAccountBehavior.DefaultReceivables,
      isControlAccount: true,
      controlAccountId: null,
      currency,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      createdBy: payload.userId,
    });
  };
}

/**
 *
 * Creates a statutory receivable sub account account
 *
 * @param deps IDependencies
 * @returns Audited IReceivablesAccount
 *
 */
function makeCreateStatutoryReceivableSubAccount(
  deps: IDependencies
): IReceivablesAccountService['createStatutoryReceivableSubAccount'] {
  return async (payload, repoOptions) => {
    const validator = (controlAccount: ILedgerAccount) => {
      return (
        controlAccount.type === ELedgerType.Asset &&
        controlAccount.subType === EAssetSubType.Receivables &&
        controlAccount.isControlAccount &&
        (controlAccount.behavior === EAssetAccountBehavior.DefaultReceivables ||
          controlAccount.behavior === EAssetAccountBehavior.StatutoryReceivable)
      );
    };

    const { controlAccount, factoryContext } =
      await controlAccountResolverHelper<TReceivablesLedgerCode>({
        ledgerAccountRepo: deps.ledgerAccountRepo,
        accountingEntityId: payload.accountingEntity.id,
        controlAccountCode: payload.controlAccountCode,
        repoOptions,
        validator,
      });

    const code = ledgerAccountEntity.getSubLedgerCode(
      LEDGER_CODE.PREFIX,
      factoryContext.precedingCode
    );

    const materializedPath =
      ledgerAccountEntity.getMaterializedPath<TReceivablesLedgerCode>(
        factoryContext.parentMaterializedPath,
        code
      );

    return ledgerAccountEntity.make({
      name: payload.name,
      accountingEntityId: payload.accountingEntity.id,
      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Asset),
      type: ELedgerType.Asset,
      subType: EAssetSubType.Receivables,
      behavior: EAssetAccountBehavior.StatutoryReceivable,
      isControlAccount: payload.isControlAccount,
      controlAccountId: controlAccount.id,
      currency: payload.currency,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.userId,
    });
  };
}

/**
 *
 * Creates a trade receivable sub account account
 *
 * @param deps IDependencies
 * @returns Audited IReceivablesAccount
 *
 */
function makeCreateTradeReceivableSubAccount(
  deps: IDependencies
): IReceivablesAccountService['createTradeReceivableSubAccount'] {
  return async (payload, repoOptions) => {
    const validator = (controlAccount: ILedgerAccount) => {
      return (
        controlAccount.type === ELedgerType.Asset &&
        controlAccount.subType === EAssetSubType.Receivables &&
        controlAccount.isControlAccount &&
        (controlAccount.behavior === EAssetAccountBehavior.DefaultReceivables ||
          controlAccount.behavior === EAssetAccountBehavior.TradeReceivable)
      );
    };

    const { controlAccount, factoryContext } =
      await controlAccountResolverHelper<TReceivablesLedgerCode>({
        ledgerAccountRepo: deps.ledgerAccountRepo,
        accountingEntityId: payload.accountingEntity.id,
        controlAccountCode: payload.controlAccountCode,
        repoOptions,
        validator,
      });

    const code = ledgerAccountEntity.getSubLedgerCode(
      LEDGER_CODE.PREFIX,
      factoryContext.precedingCode
    );

    const materializedPath =
      ledgerAccountEntity.getMaterializedPath<TReceivablesLedgerCode>(
        factoryContext.parentMaterializedPath,
        code
      );

    return ledgerAccountEntity.make({
      name: payload.name,
      accountingEntityId: payload.accountingEntity.id,
      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Asset),
      type: ELedgerType.Asset,
      subType: EAssetSubType.Receivables,
      behavior: EAssetAccountBehavior.TradeReceivable,
      isControlAccount: payload.isControlAccount,
      controlAccountId: controlAccount.id,
      currency: payload.currency,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      createdBy: payload.userId,
    });
  };
}

export default function makeReceivablesAccountService(deps: IDependencies) {
  const service: IReceivablesAccountService = {
    createHeader: makeCreateHeader(deps),

    createStatutoryReceivableSubAccount:
      makeCreateStatutoryReceivableSubAccount(deps),

    createTradeReceivableSubAccount: makeCreateTradeReceivableSubAccount(deps),
  };

  return Object.freeze(service);
}
