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
import { ITransferTransactionReq } from '../../../app/bookkeeping/dtos/bookkeeping.dto';
import bookkeepingUseCases from '../../../app/bookkeeping/usecases';
import { IHttpErrorDto } from '../../../app/shared/dtos/error.dto';
import { IPaginationDto } from '../../../app/shared/dtos/pagination.dto';
import { TEntityId } from '../../../shared/types/uuid';
import middlewares from '../middlewares';

@Route('bookkeeping')
@Tags('Bookkeeping')
export class BookkeepingController extends Controller {
  /**
   * Create a new petty cash sub account
   */
  @Post('/transfer')
  @OperationId('record-transfer')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('422')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.accountingEntityAccess
  )
  public async recordTransfer(@Body() body: ITransferTransactionReq) {
    return bookkeepingUseCases.recordTransfer(body);
  }

  /**
   * List transactions
   */

  @Get('/transactions/accounts/:accountId')
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
    return bookkeepingUseCases.getAccountTransactions(
      accountId as TEntityId,
      pagination
    );
  }
}
