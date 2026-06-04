import IAccountTransactionQueryRepo from '../../../domain/bookkeeping/repos/account-transaction-query.repo';
import journalEntryRules from '../../../domain/bookkeeping/rules/journal-entry.rule';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { ILedgerAccountService } from '../../../domain/ledger/types/ledger-account.service.types';
import { IPaginatedResponse } from '../../../shared/types/pagination.types';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IRequestContext from '../../contracts/app/request-context.contract';
import { IAccountTransactionRes } from '../../contracts/dto/bookkeeping.dto';
import {
  IPaginationDto,
  paginationQueryValidationSchema,
} from '../../contracts/dto/pagination.dto';
import appError from '../../errors/app.error';
import ledgerAppError from '../../errors/ledger.error';
import accountTransactionMapper from '../../mappers/bookkeeping/account-transaction.mapper';
import paginationMapper from '../../mappers/pagination.mapper';

export default function makeGetAccountTransactionsUseCase(
  requestContext: IRequestContext,
  ledgerAccountRepo: ILedgerAccountRepo,
  ledgerAccountService: ILedgerAccountService,
  accountTransactionQueryRepo: IAccountTransactionQueryRepo
) {
  return async (
    accountId: TEntityId,
    pagination: IPaginationDto
  ): Promise<IPaginatedResponse<IAccountTransactionRes>> => {
    zodValidationRunner(paginationQueryValidationSchema, pagination);

    const { user, correlationId } = requestContext.get();

    const trace = { correlationId };

    const ledgerAccount = await ledgerAccountRepo.findById(accountId, trace);

    if (!ledgerAccount) {
      throw new ledgerAppError.AccountNotFound();
    }

    const canAccessAccount = await ledgerAccountService.validateAccountAccess(
      ledgerAccount.id,
      user.id,
      trace
    );

    if (!canAccessAccount) {
      throw new appError.Forbidden();
    }

    const transactions = await accountTransactionQueryRepo.findAllByAccountId(
      accountId,
      {
        ...trace,
        ...paginationMapper.fromDto(pagination),
      }
    );

    const data: IAccountTransactionRes[] = transactions.data.map((trx) => ({
      ...accountTransactionMapper.toDto(trx),
      balanceEffect: journalEntryRules.getBalanceEffect(
        ledgerAccount,
        trx.side
      ),
    }));

    return {
      data,
      meta: transactions.meta,
    };
  };
}
