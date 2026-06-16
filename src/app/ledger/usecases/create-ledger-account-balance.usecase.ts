import currencyEntity from '../../../domain/currency/entities/currency.entity';
import ILedgerAccountBalanceRepo from '../../../domain/ledger/repos/ledger-account-balance.repo';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import IAccountBalanceService from '../../../domain/ledger/types/account-balance.service.types';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import ILogger from '../../../shared/contracts/logger.contract';
import IRequestContext from '../../../shared/contracts/request-context.contract';
import appError from '../../shared/errors/app.error';

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
      throw new appError.Unauthorized();
    }

    const isExisting = await ledgerAccountBalanceRepo.findByAccountId(
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
