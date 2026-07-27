import balanceEffectRule from '../../../domain/accounting/rules/bookkeeping/balance-effect.rule';
import ILedgerAccountRepo from '../../../domain/ledger/shared/repos/ledger-account.repo';
import appError from '../../../shared/errors/app.error';
import { IPaginationDto } from '../../../shared/pagination/dto/pagination.dto';
import paginationMapper from '../../../shared/pagination/dto/pagination.dto.mapper';
import { paginationDtoValidation } from '../../../shared/pagination/dto/pagination.dto.validation';
import { IPaginatedResponse } from '../../../shared/pagination/types/pagination.types';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IAppContext from '../../_internal/contracts/app-context.contract';
import IAccountTransactionQueryRepo from '../contracts/account-transaction.query.repo.contract';
import { IAccountTransactionRes } from '../dtos/account-transaction/account-transaction.dto';
import accountTransactionMapper from '../dtos/account-transaction/account-transaction.dto.mapper';
import ledgerAppError from '../errors/ledger.error';

interface IDependencies {
  appContext: IAppContext;
  ledgerAccountRepo: ILedgerAccountRepo;
  accountTransactionQueryRepo: IAccountTransactionQueryRepo;
}

export default function makeGetAccountTransactionsUseCase(deps: IDependencies) {
  return async (
    accountId: TEntityId,
    pagination: IPaginationDto
  ): Promise<IPaginatedResponse<IAccountTransactionRes>> => {
    zodValidationRunner(paginationDtoValidation, pagination);

    const { user, correlationId } = deps.appContext.get();

    const trace = { correlationId };

    const ledgerAccount = await deps.ledgerAccountRepo.findById(
      accountId,
      trace
    );

    if (!ledgerAccount) {
      throw new ledgerAppError.AccountNotFound();
    }

    const canAccessAccount = ledgerAccount?.createdBy === user.id;

    if (!canAccessAccount) {
      throw new appError.Forbidden();
    }

    const transactions =
      await deps.accountTransactionQueryRepo.findAllByAccountId(accountId, {
        ...trace,
        ...paginationMapper.fromDto(pagination),
      });

    const data: IAccountTransactionRes[] = transactions.data.map((trx) => ({
      ...accountTransactionMapper.toDto(trx),
      balanceEffect: balanceEffectRule.derive(ledgerAccount, trx.side),
    }));

    return {
      data,
      meta: transactions.meta,
    };
  };
}
