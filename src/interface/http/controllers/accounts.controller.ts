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
import { IBankAccountCreationReq } from '../../../app/ledger/dtos/asset-account/asset-account.dto';
import { ILedgerAccountDto } from '../../../app/ledger/dtos/ledger-account/ledger-account.dto';
import ledgerUseCases from '../../../infra/ioc/usecases/ledger';
import { IHttpErrorDto } from '../../../shared/errors/error.dto';
import middlewares from '../middlewares';

@Route('accounts')
@Tags('Accounts')
export class AccountsController extends Controller {
  /**
   * Create a new asset bank sub account
   */
  @Tags('Asset Accounts')
  @Post('/asset/bank')
  @OperationId('createBankAccount')
  @SuccessResponse('201')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('401')
  @Response<IHttpErrorDto>('409')
  @Response<IHttpErrorDto>('422')
  @Response<IHttpErrorDto>('500')
  @Middlewares(
    middlewares.isAuthenticatedUser,
    middlewares.accountingEntityAccess
  )
  public async createBankAccount(
    @Body() body: IBankAccountCreationReq
  ): Promise<ILedgerAccountDto> {
    this.setStatus(201);
    return await ledgerUseCases.createBankAccount(body);
  }
}
