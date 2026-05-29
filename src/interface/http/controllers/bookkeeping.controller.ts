import {
  Body,
  Controller,
  Middlewares,
  OperationId,
  Post,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { ITransferTransactionReq } from '../../../app/contracts/dto/bookkeeping.dto';
import { IHttpErrorDto } from '../../../app/contracts/dto/error.dto';
import bookkeepingUseCases from '../../../app/usecases/bookkeeping';
import middlewares from '../middlewares';

@Route('bookkeeping')
@Tags('Bookkeeping')
export class BookkeepingController extends Controller {
  /**
   * Create a new petty cash sub account
   */
  @Post('/')
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
}
