import ILedgerAccountBalanceRepo from '../../../domain/bookkeeping/repos/ledger-account-balance.repo';
import makeLedgerAccountBalanceService from '../../../domain/bookkeeping/services/account-balance.service';
import { SYSTEM_CURRENCIES } from '../../../domain/currency/config/currencies.config';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { ILedgerAccount } from '../../../domain/ledger/types/ledger.types';
import { ErrorUnauthorized } from '../../../shared/value-objects/error';
import IRequestContext from '../../contracts/app/request-context.contract';
import ILogger from '../../contracts/infra/logger.contract';

export default function makeCreateLedgerAccountBalanceUseCase(
  requestContext: IRequestContext,
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo,
  ledgerAccountRepo: ILedgerAccountRepo,
  logger: ILogger
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

    const ledgerAccountBalanceService = makeLedgerAccountBalanceService(
      ledgerAccountBalanceRepo
    );

    const balance = await ledgerAccountBalanceService.createBalance(
      ledgerAccount,
      // TODO: use accounting entity's functional currency
      SYSTEM_CURRENCIES.NGN,
      { correlationId }
    );

    await ledgerAccountBalanceRepo.create(balance, { correlationId });
  };
}
