import ILedgerAccountBalanceRepo from '../../../domain/ledger/account-balance/repos/ledger-account-balance.repo';
import ledgerAccountError from '../../../domain/ledger/errors/ledger-account.error';
import ILedgerAccountRepo from '../../../domain/ledger/shared/repos/ledger-account.repo';
import currencyEntity from '../../../domain/money/entities/currency.entity';
import moneyValue from '../../../domain/money/values/money.vo';
import IReporter from '../../../shared/contracts/reporter.contract';
import { TEntityId } from '../../../shared/types/uuid';
import stringUtils from '../../../shared/utils/string';
import appError from '../../../shared/values/errors/app.error';
import IAppContext from '../../context/contracts/app-context.contract';
import { ILedgerAccountDto } from '../dtos/ledger-account/ledger-account.dto';
import ledgerAccountMapper from '../dtos/ledger-account/ledger-account.dto.mapper';
import ledgerAppError from '../errors/ledger.error';

interface IDependencies {
  appContext: IAppContext;
  ledgerAccountRepo: ILedgerAccountRepo;
  reporter: IReporter;
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo;
}

export default function makeGetLedgerAccountUseCase(deps: IDependencies) {
  return async (accountId: TEntityId): Promise<ILedgerAccountDto> => {
    stringUtils.validateUUID(accountId, ledgerAccountError.InvalidId);

    const { correlationId, accountingEntity, user } = deps.appContext.get();

    const trace = { correlationId };

    const account = await deps.ledgerAccountRepo.findById(
      accountId,
      accountingEntity.id,
      trace
    );

    if (!account) {
      throw new ledgerAppError.AccountNotFound();
    }

    // TODO: add proper user access validation;
    const isOwner = account?.createdBy === user.id;

    if (!isOwner) {
      throw new appError.Forbidden();
    }

    let balance = await deps.ledgerAccountBalanceRepo.findByAccountId(
      accountId,
      accountingEntity.id,
      trace
    );

    if (!balance) {
      deps.reporter.report(new ledgerAppError.BalanceNotFound({ accountId }));

      const zeroBalance = moneyValue.makeZeroAmount(account.currency);
      const zeroFunctionalBalance = moneyValue.makeZeroAmount(
        currencyEntity.getByCode(accountingEntity.functionalCurrencyCode)
      );

      return ledgerAccountMapper.toDto(
        account,
        zeroBalance,
        zeroFunctionalBalance
      );
    }

    return ledgerAccountMapper.toDto(
      account,
      balance.amount,
      balance.functionalAmount
    );
  };
}
