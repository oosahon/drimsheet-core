import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import currencyEntity from '../../../../domain/currency/entities/currency.entity';
import { ASSET_LEDGER_CODES } from '../../../../domain/ledger/config/asset-codes.config';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import receivablesAccountEntity from '../../../../domain/ledger/entities/01-asset-account/02-receivables.entity';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import {
  IAssetLedgerAccount,
  IReceivablesAccount,
} from '../../../../domain/ledger/types/asset-account.types';
import {
  TAssetLedgerCode,
  TReceivablesLedgerCode,
} from '../../../../domain/ledger/types/ledger-code.types';
import {
  IEvent,
  TEntityWithEvents,
} from '../../../../shared/types/event.types';
import IRequestContext from '../../../contracts/app/request-context.contract';

export default function makeSetupAssetHeaderAccountsUseCase(
  requestContext: IRequestContext,
  ledgerAccountRepo: ILedgerAccountRepo
) {
  /**
   * Sets up the following asset accounts for an individual:
   *  - Cash and Cash Equivalents:    100000
   *  - Receivables:                  102000
   *    - Trade Receivables:          102001
   *    - Statutory Receivables:        102002
   */
  return async (accountingEntity: IAccountingEntity) => {
    const { user, correlationId } = requestContext.get();
    const accountingEntityId = accountingEntity.id;
    const createdBy = user.id;
    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );

    const trace = { correlationId };

    const getExistingAccounts = async <T extends IAssetLedgerAccount>(
      code: TAssetLedgerCode
    ) => {
      return (await ledgerAccountRepo.findByCode(
        code,
        accountingEntityId,
        trace
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
      allAccounts.push(statutoryReceivables);
    }

    const accounts: IAssetLedgerAccount[] = [];
    const events: IEvent<IAssetLedgerAccount>[] = [];

    for (const [account, accountEvents] of allAccounts) {
      accounts.push(account);
      events.push(...accountEvents);
    }

    return { accounts, events };
  };
}
