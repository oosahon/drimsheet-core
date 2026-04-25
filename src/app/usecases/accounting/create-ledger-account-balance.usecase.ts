import ledgerAccountBalanceEntity from '../../../domain/accounting/entities/ledger-account-balance.entity';
import ILedgerAccountBalanceRepo from '../../../domain/accounting/repos/ledger-account-balance.repo';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import { ErrorUnauthorized } from '../../../shared/value-objects/error';
import IRequestContext from '../../contracts/app/request-context.contract';

export default function makeCreateLedgerAccountBalanceUseCase(
  requestContext: IRequestContext,
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo
) {
  return async (ledgerAccount: ILedgerAccount) => {
    const { user, correlationId, accountingEntity } = requestContext.get();

    if (!user || !accountingEntity) {
      throw new ErrorUnauthorized();
    }

    const balance = ledgerAccountBalanceEntity.make({
      ledgerAccountId: ledgerAccount.id,
      accountingEntityId: accountingEntity.id,
      accountMaterializedPath: ledgerAccount.materializedPath,
      currencyCode: ledgerAccount.currency.code,
      functionalCurrencyCode: accountingEntity.functionalCurrency.code,
    });

    await ledgerAccountBalanceRepo.create(balance, { correlationId });

    return balance;
  };
}
