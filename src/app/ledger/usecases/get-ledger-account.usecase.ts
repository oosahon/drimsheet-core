import currencyEntity from '../../../domain/currency/entities/currency.entity';
import ILedgerAccountBalanceRepo from '../../../domain/ledger/account-balance/repos/ledger-account-balance.repo';
import ledgerError from '../../../domain/ledger/shared/errors/ledger.error';
import ILedgerAccountRepo from '../../../domain/ledger/shared/repos/ledger-account.repo';
import IReporter from '../../../shared/contracts/reporter.contract';
import { TEntityId } from '../../../shared/types/uuid';
import stringUtils from '../../../shared/utils/string';
import moneyValue from '../../../shared/value-objects/money.vo';
import IRequestContext from '../../shared/contracts/request-context.contract';
import appError from '../../shared/errors/app.error';
import { ILedgerAccountDto } from '../dtos/ledger-account.dto';
import ledgerAppError from '../errors/ledger.error';
import ledgerAccountMapper from '../mappers/ledger-account.mapper';

interface IDependencies {
  requestContext: IRequestContext;
  ledgerAccountRepo: ILedgerAccountRepo;
  reporter: IReporter;
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo;
}

export default function makeGetLedgerAccountUseCase(deps: IDependencies) {
  return async (accountId: TEntityId): Promise<ILedgerAccountDto> => {
    stringUtils.validateUUID(accountId, ledgerError.InvalidId);

    const { correlationId, accountingEntity, user } = deps.requestContext.get();

    const trace = { correlationId };

    const account = await deps.ledgerAccountRepo.findById(accountId, trace);

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
      deps.reporter.report(
        new Error(`No balance found for ledger account with id ${accountId}`)
      );

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
