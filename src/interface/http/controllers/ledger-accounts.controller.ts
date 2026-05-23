import {
  Controller,
  Get,
  Middlewares,
  OperationId,
  Path,
  Queries,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { IHttpErrorDto } from '../../../app/contracts/dto/error.dto';
import { IGetLedgerAccountsQuery } from '../../../app/contracts/dto/ledger-account.dto';
import ledgerAccountUsecases from '../../../app/usecases/ledger/shared';
import { TEntityId } from '../../../shared/types/uuid';
import middlewares from '../middlewares';

@Route('ledger/accounts')
@Tags('Ledger Accounts')
export class LedgerAccountController extends Controller {
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
    return await ledgerAccountUsecases.getLedgerAccounts(query);
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
    return await ledgerAccountUsecases.getLedgerAccount(accountId as TEntityId);
  }
}
