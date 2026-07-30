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
import { IPettyCashAccountCreationReq } from '../../../app/ledger/dtos/asset-account/asset-account.dto';
import {
  IGetLedgerAccountsQuery,
  ILedgerAccountDto,
} from '../../../app/ledger/dtos/ledger-account/ledger-account.dto';
import ledgerUseCases from '../../../infra/ioc/usecases/ledger';
import { IHttpErrorDto } from '../../../shared/errors/error.dto';
import { IPaginationDto } from '../../../shared/pagination/dto/pagination.dto';
import { TEntityId } from '../../../shared/types/uuid';
import middlewares from '../middlewares';

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
    return await ledgerUseCases.getLedgerAccounts(query);
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
    return await ledgerUseCases.createPettyCashAccount(body);
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
    return await ledgerUseCases.getLedgerAccount(accountId as TEntityId);
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
    return ledgerUseCases.getAccountTransactions(
      accountId as TEntityId,
      pagination
    );
  }
}
