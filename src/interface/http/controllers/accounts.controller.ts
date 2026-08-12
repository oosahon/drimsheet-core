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

import { IHttpErrorDto } from '@shared/values/errors/error.dto';

import { IBankAccountCreationReq } from '@app/ledger/dtos/asset-account/asset-account.dto';
import { ILedgerAccountDto } from '@app/ledger/dtos/ledger-account/ledger-account.dto';

import middlewares from '@infra/ioc/middlewares/http';
import { createBankAccountUseCase } from '@infra/ioc/usecases/ledger';

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
    return await createBankAccountUseCase(body);
  }
}
