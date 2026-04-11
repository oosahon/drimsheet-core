import {
  Controller,
  Get,
  Middlewares,
  OperationId,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';
import accountingEntityUsecase from '../../../app/usecases/accounting-entity';
import middlewares from '../middlewares';

@Route('accounting-entities')
@Tags('Accounting Entity')
export class AccountingEntityController extends Controller {
  /**
   * Get all accounting entities of an authenticated user
   */
  @Get('/')
  @OperationId('getAll')
  @SuccessResponse('200')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async getAccountingEntities() {
    return await accountingEntityUsecase.getAll();
  }
}
