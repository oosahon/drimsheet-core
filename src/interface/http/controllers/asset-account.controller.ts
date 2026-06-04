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
import { IPettyCashAccountCreationReq } from '../../../app/ledger/dtos/asset-account.dto';
import assetAccountUseCase from '../../../app/ledger/usecases/asset-account';
import { IHttpErrorDto } from '../../../app/shared/dtos/error.dto';
import middlewares from '../middlewares';

@Route('ledger/asset-accounts')
@Tags('Ledger Accounts', 'Asset Account')
export class AssetAccountController extends Controller {
  /**
   * Create a new petty cash sub account
   */
  @Post('/petty-cash')
  @OperationId('makePettyCashSubAccount')
  @SuccessResponse('200')
  @Response<IHttpErrorDto>('400')
  @Response<IHttpErrorDto>('422')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async makePettyCashSubAccount(
    @Body() body: IPettyCashAccountCreationReq
  ) {
    return await assetAccountUseCase.makePettyCashSubAccount(body);
  }
}
