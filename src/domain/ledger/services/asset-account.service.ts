import cashAndEquivalentAccountEntity from '../asset-account/entities/cash-and-equivalents.entity';
import resolveCashSubAccountScope from '../asset-account/entities/helpers/cash-sub-account-scope.helper';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import IAssetAccountService from '../types/asset-account.service.types';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}

export default function makeAssetAccountService(
  deps: IDependencies
): IAssetAccountService {
  /**
   * Create a new petty cash account
   */
  const createPettyCashSubAccount: IAssetAccountService['createPettyCashSubAccount'] =
    async (payload, repoOptions) => {
      const { controlAccount, factoryContext } =
        await resolveCashSubAccountScope(
          deps.ledgerAccountRepo,
          payload.accountingEntity.id,
          payload.controlAccountCode,
          repoOptions
        );

      const factoryPayload = {
        name: payload.name,
        currency: payload.currency,
        isControlAccount: payload.isControlAccount,
        createdBy: payload.userId,
        controlAccountId: controlAccount.id,
        accountingEntityId: payload.accountingEntity.id,
      };

      return cashAndEquivalentAccountEntity.makePettyCashAccount(
        factoryPayload,
        factoryContext
      );
    };

  /**
   * Create a new bank sub account
   */
  const createBankSubAccount: IAssetAccountService['createBankSubAccount'] =
    async (payload, repoOptions) => {
      const { controlAccount, factoryContext } =
        await resolveCashSubAccountScope(
          deps.ledgerAccountRepo,
          payload.accountingEntity.id,
          payload.controlAccountCode,
          repoOptions
        );

      const factoryPayload = {
        name: payload.name,
        currency: payload.currency,
        isControlAccount: false,
        createdBy: payload.userId,
        controlAccountId: controlAccount.id,
        accountingEntityId: payload.accountingEntity.id,
        meta: payload.bankDetails,
      };

      return cashAndEquivalentAccountEntity.makeBankAccount(
        factoryPayload,
        factoryContext
      );
    };

  return Object.freeze({
    createPettyCashSubAccount,
    createBankSubAccount,
  });
}
