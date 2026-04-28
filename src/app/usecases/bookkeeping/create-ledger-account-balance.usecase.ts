import ILedgerAccountBalanceRepo from '../../../domain/bookkeeping/repos/ledger-account-balance.repo';
import IAccountBalanceService from '../../../domain/bookkeeping/types/account-balance.service.types';
import currencyEntity from '../../../domain/currency/entities/currency.entity';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import { ErrorUnauthorized } from '../../../shared/errors/error';
import IRequestContext from '../../contracts/app/request-context.contract';
import ILogger from '../../contracts/infra/logger.contract';

export default function makeCreateLedgerAccountBalanceUseCase(
  requestContext: IRequestContext,
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo,
  ledgerAccountRepo: ILedgerAccountRepo,
  logger: ILogger,
  accountBalanceService: IAccountBalanceService
) {
  return async (ledgerAccount: ILedgerAccount) => {
    const { user, correlationId, accountingEntity } = requestContext.get();

    if (!user || !accountingEntity) {
      throw new ErrorUnauthorized();
    }

    const isExisting = await ledgerAccountBalanceRepo.findBalanceByAccountId(
      ledgerAccount.id,
      accountingEntity.id,
      { correlationId }
    );

    if (isExisting) {
      logger.info(
        `Skipping creation of ledger account balance (${ledgerAccount.id}) because it already exists`,
        { correlationId }
      );
      return;
    }

    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );

    const balance = await accountBalanceService.createBalance(
      ledgerAccount,
      functionalCurrency,
      { correlationId }
    );

    await ledgerAccountBalanceRepo.create(balance, { correlationId });
  };
}
