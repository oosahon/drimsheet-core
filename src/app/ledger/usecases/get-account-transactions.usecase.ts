import balanceEffectRule from '../../../domain/accounting/rules/bookkeeping/balance-effect.rule';
import ILedgerAccountRepo from '../../../domain/ledger/shared/repos/ledger-account.repo';
import { ILedgerAccountService } from '../../../domain/ledger/shared/types/ledger-account.service.types';
import IAppContext from '../../../shared/contracts/app-context.contract';
import { IPaginatedResponse } from '../../../shared/types/pagination.types';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import { IPaginationDto } from '../../shared/dtos/pagination/pagination.dto';
import paginationMapper from '../../shared/dtos/pagination/pagination.dto.mapper';
import { paginationQueryValidationSchema } from '../../shared/dtos/pagination/pagination.dto.validation';
import appError from '../../shared/errors/app.error';
import IAccountTransactionQueryRepo from '../contracts/account-transaction.query.repo.contract';
import { IAccountTransactionRes } from '../dtos/account-transaction/account-transaction.dto';
import accountTransactionMapper from '../dtos/account-transaction/account-transaction.dto.mapper';
import ledgerAppError from '../errors/ledger.error';

interface IDependencies {
  appContext: IAppContext;
  ledgerAccountRepo: ILedgerAccountRepo;
  ledgerAccountService: ILedgerAccountService;
  accountTransactionQueryRepo: IAccountTransactionQueryRepo;
}

export default function makeGetAccountTransactionsUseCase(deps: IDependencies) {
  return async (
    accountId: TEntityId,
    pagination: IPaginationDto
  ): Promise<IPaginatedResponse<IAccountTransactionRes>> => {
    zodValidationRunner(paginationQueryValidationSchema, pagination);

    const { user, correlationId } = deps.appContext.get();

    const trace = { correlationId };

    const ledgerAccount = await deps.ledgerAccountRepo.findById(
      accountId,
      trace
    );

    if (!ledgerAccount) {
      throw new ledgerAppError.AccountNotFound();
    }

    const canAccessAccount =
      await deps.ledgerAccountService.validateAccountAccess(
        ledgerAccount.id,
        user.id,
        trace
      );

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
