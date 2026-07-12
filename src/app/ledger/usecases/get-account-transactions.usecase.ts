import balanceEffectRule from '../../../domain/accounting/rules/bookkeeping/balance-effect.rule';
import ILedgerAccountRepo from '../../../domain/ledger/shared/repos/ledger-account.repo';
import { ILedgerAccountService } from '../../../domain/ledger/shared/types/ledger-account.service.types';
import { IPaginatedResponse } from '../../../shared/types/pagination.types';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IRequestContext from '../../shared/contracts/request-context.contract';
import {
  IPaginationDto,
  paginationQueryValidationSchema,
} from '../../shared/dtos/pagination.dto';
import appError from '../../shared/errors/app.error';
import paginationMapper from '../../shared/mappers/pagination.mapper';
import IAccountTransactionQueryRepo from '../contracts/account-transaction.query.repo.contract';
import { IAccountTransactionRes } from '../dtos/account-transaction.dto';
import ledgerAppError from '../errors/ledger.error';
import accountTransactionMapper from '../mappers/account-transaction.mapper';

interface IDependencies {
  requestContext: IRequestContext;
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

    const { user, correlationId } = deps.requestContext.get();

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
