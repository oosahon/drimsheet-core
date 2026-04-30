import { IEvent, TEntityWithEvents } from '../../../shared/types/event.types';
import currencyEntity from '../../currency/entities/currency.entity';
import { ASSET_LEDGER_CODES } from '../config/asset-codes.config';
import cashAndEquivalentAccountEntity from '../entities/01-asset-account/00-cash-and-equivalents.entity';
import receivablesAccountEntity from '../entities/01-asset-account/02-receivables.entity';
import assetSuspenseAccountEntity from '../entities/01-asset-account/99-suspense-account.entity';
import error from '../errors';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import IAssetAccountService from '../types/asset-account.service.types';
import {
  EAssetAccountBehavior,
  EAssetSubType,
  IAssetLedgerAccount,
  IReceivablesAccount,
  IStatutoryReceivableAccount,
} from '../types/asset-account.types';
import {
  TAssetLedgerCode,
  TCashLedgerCode,
  TReceivablesLedgerCode,
} from '../types/ledger-code.types';
import { ELedgerType } from '../types/ledger.types';

type TBootstrapHeaders = IAssetAccountService['bootstrapHeaderAccounts'];

type TCreatePettyCashSubAccount =
  IAssetAccountService['makePettyCashSubAccount'];

type TBootstrapIndividualPostingAccounts =
  IAssetAccountService['bootstrapIndividualPostingAccounts'];

export default function makeAssetAccountService(
  repo: ILedgerAccountRepo
): IAssetAccountService {
  /**
   * Bootstraps header asset accounts for a new accounting entity
   *  - Cash and Cash Equivalents:    100000
   *  - Receivables:                  102000
   *    - Trade Receivables:          102001
   *    - Statutory Receivables:        102002
   */
  const bootstrapHeaderAccounts: TBootstrapHeaders = async (
    accountingEntity,
    repoOptions,
    shouldBootstrapPostingAccounts
  ) => {
    const accountingEntityId = accountingEntity.id;
    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );
    const createdBy = accountingEntity.ownerId;

    const getExistingAccounts = async <T extends IAssetLedgerAccount>(
      code: TAssetLedgerCode
    ) => {
      return (await repo.findByCode(
        code,
        accountingEntityId,
        repoOptions
      )) as T | null;
    };

    const allAccounts: TEntityWithEvents<
      IAssetLedgerAccount,
      IAssetLedgerAccount
    >[] = [];

    /**
     * ==================== Cash and Cash Equivalents ====================
     */
    const cashHeaderCode = ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER;
    const existingCashHeader = await getExistingAccounts(cashHeaderCode);

    const ccePayload = {
      name: 'Cash and Cash Equivalents',
      createdBy,
      accountingEntityId,
      currency: functionalCurrency,
    };

    if (!existingCashHeader) {
      const cce = cashAndEquivalentAccountEntity.makeHeader(ccePayload);
      allAccounts.push(cce);
    }

    /**
     * ==================== Receivables ====================
     */
    const receivablesHeaderCode = ASSET_LEDGER_CODES.RECEIVABLES.HEADER;
    let existingReceivablesHeader =
      await getExistingAccounts<IReceivablesAccount>(receivablesHeaderCode);

    if (!existingReceivablesHeader) {
      const receivables = receivablesAccountEntity.makeHeader({
        name: 'Receivables',
        createdBy,
        accountingEntityId,
        currency: functionalCurrency,
      });
      existingReceivablesHeader = receivables[0];
      allAccounts.push(receivables);
    }

    /**
     * ==================== Trade Receivables ====================
     */
    const tradeReceivablesCode = ASSET_LEDGER_CODES.RECEIVABLES.TRADE;
    let existingTradeReceivables =
      await getExistingAccounts<IReceivablesAccount>(tradeReceivablesCode);

    if (!existingTradeReceivables) {
      const tradeReceivables =
        receivablesAccountEntity.makeTradeReceivableAccount(
          {
            name: 'Trade Receivables',
            createdBy,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: existingReceivablesHeader.id,
          },
          {
            precedingCode:
              existingReceivablesHeader.code as TReceivablesLedgerCode,
            parentMaterializedPath:
              existingReceivablesHeader.materializedPath as TReceivablesLedgerCode,
          }
        );
      existingTradeReceivables = tradeReceivables[0];
      allAccounts.push(tradeReceivables);
    }

    /**
     * ==================== Statutory Receivables ====================
     */
    const statutoryReceivablesCode = ASSET_LEDGER_CODES.RECEIVABLES.STATUTORY;
    const isExistingStatutoryReceivables = await getExistingAccounts(
      statutoryReceivablesCode
    );

    let statutoryReceivablesHeader: IStatutoryReceivableAccount;

    if (!isExistingStatutoryReceivables) {
      const statutoryReceivables =
        receivablesAccountEntity.makeStatutoryReceivableAccount(
          {
            name: 'Statutory Receivables',
            createdBy,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: existingReceivablesHeader.id,
          },
          {
            precedingCode:
              existingTradeReceivables.code as TReceivablesLedgerCode,
            parentMaterializedPath:
              existingReceivablesHeader.materializedPath as TReceivablesLedgerCode,
          }
        );
      statutoryReceivablesHeader =
        statutoryReceivables[0] as IStatutoryReceivableAccount;
      allAccounts.push(statutoryReceivables);
    } else {
      statutoryReceivablesHeader =
        isExistingStatutoryReceivables as IStatutoryReceivableAccount;
    }

    if (shouldBootstrapPostingAccounts) {
      const postingAccountsWithEvents =
        await bootstrapIndividualPostingAccounts(
          accountingEntity,
          { statutoryReceivablesHeader },
          repoOptions
        );
      allAccounts.push(...postingAccountsWithEvents);
    }

    const accounts: IAssetLedgerAccount[] = [];
    const events: IEvent<IAssetLedgerAccount>[] = [];

    for (const [account, accountEvents] of allAccounts) {
      accounts.push(account);
      events.push(...accountEvents);
    }

    return { accounts, events };
  };

  /**
   * Create a new petty cash account
   */
  const makePettyCashSubAccount: TCreatePettyCashSubAccount = async (
    payload,
    repoOptions
  ) => {
    const controlAccountLedgerCode =
      payload.controlAccountCode ??
      ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER;

    const controlAccount = await repo.findByCode(
      controlAccountLedgerCode,
      payload.accountingEntity.id,
      repoOptions
    );

    if (!controlAccount) {
      throw new error.ControlAccountNotFound({
        cause: { controlAccountLedgerCode },
      });
    }

    const latest = await repo.findLatestBySubType(
      payload.accountingEntity.id,
      ELedgerType.Asset,
      EAssetSubType.CashAndCashEquivalent,
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

    const precedingCode = latest?.code ?? controlAccount.code;
    const materializedPath = controlAccount.materializedPath;

    const factoryContext = {
      precedingCode: precedingCode as TCashLedgerCode,
      parentMaterializedPath: materializedPath as TCashLedgerCode,
    };

    return cashAndEquivalentAccountEntity.makePettyCashAccount(
      factoryPayload,
      factoryContext
    );
  };

  /**
   * Sets up the following asset accounts for a non-power user:
   *  - Asset Suspense Account: 199000
   *  - Default statutory receivable account: 102003
   */
  const bootstrapIndividualPostingAccounts: TBootstrapIndividualPostingAccounts =
    async (accountingEntity, headers, repoOptions) => {
      const {
        ownerId,
        id: accountingEntityId,
        functionalCurrencyCode,
      } = accountingEntity;

      const functionalCurrency = currencyEntity.getByCode(
        functionalCurrencyCode
      );

      const assetAccounts: TEntityWithEvents<
        IAssetLedgerAccount,
        IAssetLedgerAccount
      >[] = [];

      /**
       * Suspense account
       */
      const existingSuspense = await repo.findBySubType(
        accountingEntityId,
        ELedgerType.Asset,
        EAssetSubType.Suspense,
        repoOptions
      );

      if (!existingSuspense.length) {
        const account = assetSuspenseAccountEntity.make(
          {
            accountingEntityId,
            currency: functionalCurrency,
            name: 'Asset Suspense Account',
            createdBy: ownerId,
          },
          null
        );
        assetAccounts.push(account);
      }

      /**
       * Statutory receivables
       */
      const existingStatutoryReceivables = (await repo.findByBehavior(
        accountingEntityId,
        EAssetAccountBehavior.StatutoryReceivable,
        repoOptions
      )) as IStatutoryReceivableAccount[];

      // Since the header is also a statutory receivable, if length is 1, only the header exists
      if (existingStatutoryReceivables.length === 1) {
        const account = receivablesAccountEntity.makeStatutoryReceivableAccount(
          {
            name: 'Statutory Receivables (Default)',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: false,
            controlAccountId: headers.statutoryReceivablesHeader.id,
          },
          {
            precedingCode: headers.statutoryReceivablesHeader
              .code as TReceivablesLedgerCode,
            parentMaterializedPath: headers.statutoryReceivablesHeader
              .materializedPath as TReceivablesLedgerCode,
          }
        );
        assetAccounts.push(account);
      }

      return assetAccounts;
    };

  return Object.freeze({
    bootstrapHeaderAccounts,
    makePettyCashSubAccount,
    bootstrapIndividualPostingAccounts,
  });
}
