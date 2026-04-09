import {
  Controller,
  Get,
  Middlewares,
  OperationId,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';
import middlewares from '../middlewares';
import accountEntityUsecase from '../../../app/usecases/account-entity';

@Route('accounting-entities')
@Tags('Accounting Entities')
export class AccountingEntityController extends Controller {
  /**
   * Get all accounting entities of an authenticated user
   */
  @Get('/')
  @OperationId('getAll')
  @SuccessResponse('200')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async getAccountingEntities() {
    return await accountEntityUsecase.getAll();
  }
}
