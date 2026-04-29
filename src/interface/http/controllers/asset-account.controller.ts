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
import { IPettyCashAccountCreationReq } from '../../../app/contracts/dto/asset-account.dto';
import assetAccountUseCase from '../../../app/usecases/ledger/asset-account';
import { IApiError } from '../handlers/error.handler';
import middlewares from '../middlewares';

@Route('asset-accounts')
@Tags('Asset Accounts')
export class AssetAccountController extends Controller {
  /**
   * Create a new petty cash sub account
   */
  @Post('/')
  @OperationId('makePettyCashSubAccount')
  @SuccessResponse('200')
  @Response<IApiError>('400')
  @Response<IApiError>('422')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async makePettyCashSubAccount(
    @Body() body: IPettyCashAccountCreationReq
  ) {
    return await assetAccountUseCase.makePettyCashSubAccount(body);
  }
}
