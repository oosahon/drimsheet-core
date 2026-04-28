import { TEntityWithEvents } from '../../../shared/types/event.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
import { AppError } from '../../../shared/value-objects/error';
import { IAccountingEntity } from '../../accounting-entity/types/accounting-entity.types';
import { ASSET_LEDGER_CODES } from '../config/asset-codes.config';
import cashAndEquivalentAccountEntity from '../entities/01-asset-account/00-cash-and-equivalents.entity';
import receivablesAccountEntity from '../entities/01-asset-account/02-receivables.entity';
import assetSuspenseAccountEntity from '../entities/01-asset-account/99-suspense-account.entity';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import {
  EAssetAccountBehavior,
  EAssetSubType,
  IAssetLedgerAccount,
  IReceivablesAccount,
  IStatutoryReceivableAccount,
} from '../types/asset-account.types';
import { TReceivablesLedgerCode } from '../types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerType,
} from '../types/ledger.types';

interface IAssetAccountService {
  bootstrapIndividualHeaderAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<IAssetLedgerAccount, IAssetLedgerAccount>[]>;

  bootstrapIndividualPostingAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<IAssetLedgerAccount, IAssetLedgerAccount>[]>;
}

export default function makeAssetAccountBootstrapService(
  repo: ILedgerAccountRepo
): IAssetAccountService {
  const service: IAssetAccountService = {
    /**
     * Sets up the following asset accounts for an individual:
     *  - Cash and Cash Equivalents:    100000
     *  - Receivables:                  102000
     *    - Trade Receivables:          102001
     *    - Statutory Receivables:        102002
     *
     * @param accountingEntity: The individual entity account
     * @param repoOptions:      The repository options
     */
    async bootstrapIndividualHeaderAccounts(accountingEntity, repoOptions) {
      const {
        ownerId,
        id: accountingEntityId,

        functionalCurrency,
      } = accountingEntity;
      const assetAccounts: TEntityWithEvents<
        IAssetLedgerAccount,
        IAssetLedgerAccount
      >[] = [];

      const cashAndCashEquivalentCode =
        ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER;
      const receivablesCode = ASSET_LEDGER_CODES.RECEIVABLES.HEADER;
      const tradeReceivablesCode = ASSET_LEDGER_CODES.RECEIVABLES.TRADE;
      const statutoryReceivablesCode = ASSET_LEDGER_CODES.RECEIVABLES.STATUTORY;

      /**
       * cash and cash equivalent account
       */
      const isExistingCash = await repo.findByCode(
        cashAndCashEquivalentCode,
        accountingEntity.id,
        repoOptions
      );
      if (!isExistingCash) {
        const cce = cashAndEquivalentAccountEntity.make(
          {
            name: 'Cash and Cash Equivalents',
            createdBy: ownerId,
            accountingEntityId,

            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: null,
            behavior: EAssetAccountBehavior.DefaultCash,
            meta: null,
          },
          null
        );
        assetAccounts.push(cce);
      }

      /**
       * Receivables
       */
      let existingReceivables = (await repo.findByCode(
        receivablesCode,
        accountingEntityId,
        repoOptions
      )) as IReceivablesAccount | null;

      if (!existingReceivables) {
        const receivables = receivablesAccountEntity.make(
          {
            name: 'Receivables',
            createdBy: ownerId,
            accountingEntityId,

            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: null,
            behavior: EAssetAccountBehavior.DefaultReceivables,
            contraAccountRule: EContraAccountRule.ContraPermitted,
            adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
            meta: null,
          },
          null
        );
        existingReceivables = receivables[0];
        assetAccounts.push(receivables);
      }

      /**
       * Trade receivables
       */
      let existingTradeReceivables = (await repo.findByCode(
        tradeReceivablesCode,
        accountingEntityId,
        repoOptions
      )) as IReceivablesAccount | null;

      if (!existingTradeReceivables) {
        const tradeReceivables =
          receivablesAccountEntity.makeTradeReceivableAccount(
            {
              name: 'Trade Receivables',
              createdBy: ownerId,
              accountingEntityId,

              currency: functionalCurrency,
              isControlAccount: true,
              controlAccountId: existingReceivables.id,
            },
            {
              precedingCode: existingReceivables.code,
              parentMaterializedPath:
                existingReceivables.materializedPath as TReceivablesLedgerCode,
            }
          );
        existingTradeReceivables = tradeReceivables[0];
        assetAccounts.push(tradeReceivables);
      }

      /**
       * Statutory receivables
       */
      const isExistingStatutoryReceivables = await repo.findByCode(
        statutoryReceivablesCode,
        accountingEntityId,
        repoOptions
      );
      if (!isExistingStatutoryReceivables) {
        const statutoryReceivables =
          receivablesAccountEntity.makeStatutoryReceivableAccount(
            {
              name: 'Statutory Receivables',
              createdBy: ownerId,
              accountingEntityId,

              currency: functionalCurrency,
              isControlAccount: true,
              controlAccountId: existingReceivables.id,
            },
            {
              precedingCode: existingTradeReceivables.code,
              parentMaterializedPath:
                existingReceivables.materializedPath as TReceivablesLedgerCode,
            }
          );
        assetAccounts.push(statutoryReceivables);
      }

      return assetAccounts;
    },

    /**
     * Sets up the following asset accounts for a non-power user:
     *  - Asset Suspense Account: 199000
     *  - Default statutory receivable account: 102003
     * @param accountingEntity: The individual entity account
     * @param repoOptions:      The repository options
     */
    async bootstrapIndividualPostingAccounts(accountingEntity, repoOptions) {
      const {
        ownerId,
        id: accountingEntityId,

        functionalCurrency,
      } = accountingEntity;
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

      if (!existingStatutoryReceivables.length) {
        throw new AppError(
          'Statutory receivables header account not found during bootstrap'
        );
      }

      if (existingStatutoryReceivables.length === 1) {
        const account = receivablesAccountEntity.make(
          {
            name: 'Statutory Receivables (Default)',
            createdBy: ownerId,
            accountingEntityId,

            currency: functionalCurrency,
            isControlAccount: false,
            controlAccountId: existingStatutoryReceivables[0].id,
            behavior: EAssetAccountBehavior.StatutoryReceivable,
            meta: null,
            contraAccountRule: EContraAccountRule.ContraPermitted,
            adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
          },
          {
            precedingCode: existingStatutoryReceivables[0]
              .code as TReceivablesLedgerCode,
            parentMaterializedPath: existingStatutoryReceivables[0]
              .materializedPath as TReceivablesLedgerCode,
          }
        );
        assetAccounts.push(account);
      }

      return assetAccounts;
    },
  };

  return Object.freeze(service);
}
