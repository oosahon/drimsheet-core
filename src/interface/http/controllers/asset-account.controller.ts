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
import { IHttpErrorDto } from '../../../app/contracts/dto/error.dto';
import assetAccountUseCase from '../../../app/usecases/ledger/asset-account';
import middlewares from '../middlewares';

@Route('ledger/asset-accounts')
@Tags('Ledger', 'Asset Account')
export class AssetAccountController extends Controller {
  /**
   * Create a new petty cash sub account
   */
  @Post('/')
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
