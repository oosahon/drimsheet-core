import {
  Body,
  Controller,
  Get,
  Middlewares,
  OperationId,
  Path,
  Post,
  Queries,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';

import { TEntityId } from '@shared/types/uuid';
import { IHttpErrorDto } from '@shared/values/errors/error.dto';
import { IPaginationDto } from '@shared/values/pagination/dto/pagination.dto';
import { IPaginatedResponse } from '@shared/values/pagination/types/pagination.types';

import { IPettyCashAccountCreationReq } from '@app/ledger/dtos/asset-account/asset-account.dto';
import {
  IGetLedgerAccountsQuery,
  ILedgerAccountDto,
} from '@app/ledger/dtos/ledger-account/ledger-account.dto';
import { IGetPermittedPostingAccountsQuery } from '@app/ledger/dtos/permitted-posting-account/permitted-posting-account.dto';

import {
  createPettyCashAccountUseCase,
  getAccountTransactionsUseCase,
  getLedgerAccountsUseCase,
  getLedgerAccountUseCase,
  getPermittedPostingAccountsUseCase,
} from '@infra/ioc/usecases/ledger';

import middlewares from '@interface/http/middlewares';

@Route('ledger')
@Tags('Ledger')
export class LedgerController extends Controller {
  /**
   * Get paginated ledger accounts with optional filters
   */
  @Get('/')
  @OperationId('getLedgerAccounts')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('422')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async getLedgerAccounts(@Queries() query: IGetLedgerAccountsQuery) {
    return await getLedgerAccountsUseCase(query);
  }

  /**
   * Get paginated posting accounts permitted by a journal-entry rule
   */
  @Get('/posting-accounts')
  @OperationId('getPermittedPostingAccounts')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('422')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.accountingEntityAccess
  )
  public async getPermittedPostingAccounts(
    @Queries() query: IGetPermittedPostingAccountsQuery
  ) {
    return await getPermittedPostingAccountsUseCase(query);
  }

  /**
   * Create a new petty cash sub account
   */
  @Tags('Asset Accounts')
  @Post('/asset/petty-cash')
  @OperationId('createPettyCashAccount')
  @SuccessResponse('201')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('500')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.accountingEntityAccess
  )
  public async createPettyCashAccount(
    @Body() body: IPettyCashAccountCreationReq
  ): Promise<ILedgerAccountDto> {
    return await createPettyCashAccountUseCase(body);
  }

  /**
   * Get a single ledger account by id
   */
  @Get('/:accountId')
  @OperationId('getLedgerAccount')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('404')
  @Response<IHttpErrorDto>('403')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async getLedgerAccount(@Path() accountId: string) {
    return await getLedgerAccountUseCase(accountId as TEntityId);
  }

  /**
   * List transactions for an account
   */
  @Get('/:accountId/transactions')
  @OperationId('listTransactions')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.accountingEntityAccess
  )
  public async listTransactions(
    @Path('accountId') accountId: string,
    @Queries() pagination: IPaginationDto
  ) {
    return getAccountTransactionsUseCase(accountId as TEntityId, pagination);
  }
}
