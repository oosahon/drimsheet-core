import currencyEntity from '../../../money/entities/currency.entity';
import { REVENUE_LEDGER_CODES } from '../../config/revenue-codes.config';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import ledgerAccountError from '../../errors/ledger-account.error';
import ILedgerAccountRepo from '../../repos/ledger-account.repo';
import { IGainOnAssetSaleAccountService } from '../../types/gain-on-sale.service.types';
import { TGainOnAssetSaleLedgerCode } from '../../types/ledger-code.types';
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
} from '../../types/revenue-account.types';
import controlAccountResolverHelper from '../helpers/control-account-resolver';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}

const LEDGER_CODE = REVENUE_LEDGER_CODES.GAIN_ON_ASSET_SALE;

function makeCreateHeader(
  deps: IDependencies
): IGainOnAssetSaleAccountService['createHeader'] {
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
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Revenue),
      type: ELedgerType.Revenue,
      subType: ERevenueSubType.GainOnAssetSale,
      behavior: ERevenueAccountBehavior.GainOnAssetSale,
      isControlAccount: true,
      controlAccountId: null,
      currency,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.createdBy,
    });
  };
}

function makeCreateSubAccount(
  deps: IDependencies
): IGainOnAssetSaleAccountService['createSubAccount'] {
  return async (payload, repoOptions) => {
    const validator = (controlAccount: ILedgerAccount) => {
      return (
        controlAccount.type === ELedgerType.Revenue &&
        controlAccount.subType === ERevenueSubType.GainOnAssetSale &&
        controlAccount.isControlAccount &&
        controlAccount.behavior === ERevenueAccountBehavior.GainOnAssetSale
      );
    };

    const { controlAccount, factoryContext } =
      await controlAccountResolverHelper<TGainOnAssetSaleLedgerCode>({
        ledgerAccountRepo: deps.ledgerAccountRepo,
        accountingEntityId: payload.accountingEntityId,
        controlAccountCode: payload.controlAccountCode,
        repoOptions,
        validator,
      });

    const code = ledgerAccountEntity.getSubLedgerCode(
      LEDGER_CODE.PREFIX,
      factoryContext.precedingCode
    );

    const materializedPath =
      ledgerAccountEntity.getMaterializedPath<TGainOnAssetSaleLedgerCode>(
        factoryContext.parentMaterializedPath,
        code
      );

    return ledgerAccountEntity.make({
      name: payload.name,
      accountingEntityId: payload.accountingEntityId,
      code,
      materializedPath,
      normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Revenue),
      type: ELedgerType.Revenue,
      subType: ERevenueSubType.GainOnAssetSale,
      behavior: ERevenueAccountBehavior.GainOnAssetSale,
      isControlAccount: payload.isControlAccount,
      controlAccountId: controlAccount.id,
      currency: null,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: payload.createdBy,
    });
  };
}

export default function makeGainOnAssetSaleAccountService(deps: IDependencies) {
  const service: IGainOnAssetSaleAccountService = {
    createHeader: makeCreateHeader(deps),
    createSubAccount: makeCreateSubAccount(deps),
  };

  return Object.freeze(service);
}
