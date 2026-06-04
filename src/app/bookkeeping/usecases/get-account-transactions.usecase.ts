import journalEntryRules from '../../../domain/bookkeeping/rules/journal-entry.rule';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { ILedgerAccountService } from '../../../domain/ledger/types/ledger-account.service.types';
import { IPaginatedResponse } from '../../../shared/types/pagination.types';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import { IAccountTransactionRes } from '../../bookkeeping/dtos/bookkeeping.dto';
import accountTransactionMapper from '../../bookkeeping/mappers/account-transaction.mapper';
import ledgerAppError from '../../ledger/errors/ledger.error';
import IRequestContext from '../../shared/contracts/request-context.contract';
import {
  IPaginationDto,
  paginationQueryValidationSchema,
} from '../../shared/dtos/pagination.dto';
import appError from '../../shared/errors/app.error';
import paginationMapper from '../../shared/mappers/pagination.mapper';
import IAccountTransactionQueryRepo from '../contracts/account-transaction.query.repo.contract';

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
