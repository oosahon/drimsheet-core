import ILedgerAccountBalanceRepo from '../../../../domain/bookkeeping/repos/ledger-account-balance.repo';
import currencyEntity from '../../../../domain/currency/entities/currency.entity';
import ledgerError from '../../../../domain/ledger/errors/ledger.error';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import { TEntityId } from '../../../../shared/types/uuid';
import stringUtils from '../../../../shared/utils/string';
import moneyValue from '../../../../shared/value-objects/money.vo';
import { ILedgerAccountDto } from '../../../ledger/dtos/ledger-account.dto';
import ledgerAppError from '../../../ledger/errors/ledger.error';
import ledgerAccountMapper from '../../../ledger/mappers/ledger-account.mapper';
import IReporter from '../../../shared/contracts/reporter.contract';
import IRequestContext from '../../../shared/contracts/request-context.contract';
import appError from '../../../shared/errors/app.error';

export default function makeGetLedgerAccountUseCase(
  requestContext: IRequestContext,
  ledgerAccountRepo: ILedgerAccountRepo,
  reporter: IReporter,
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo
) {
  return async (accountId: TEntityId): Promise<ILedgerAccountDto> => {
    stringUtils.validateUUID(accountId, ledgerError.InvalidId);

    const { correlationId, accountingEntity, user } = requestContext.get();

    const trace = { correlationId };

    const account = await ledgerAccountRepo.findById(accountId, trace);

    if (!account) {
      throw new ledgerAppError.AccountNotFound();
    }

    // TODO: add proper user access validation;
    const isOwner = account?.createdBy === user.id;

    if (!isOwner) {
      throw new appError.Forbidden();
    }

    let balance = await ledgerAccountBalanceRepo.findByAccountId(
      accountId,
      accountingEntity.id,
      trace
    );

    if (!balance) {
      reporter.report(
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
