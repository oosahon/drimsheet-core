import {
  Controller,
  Get,
  Middlewares,
  OperationId,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';
import currencyUseCase from '../../../infra/ioc/currency/usecases';
import middlewares from '../middlewares';

@Route('currencies')
@Tags('Currency')
export class CurrencyController extends Controller {
  /**
   * Gets all system currencies
   */
  @Get('/')
  @OperationId('getAll')
  @SuccessResponse('200')
  @Middlewares(middlewares.isOptionalAuthenticatedUser)
  public async getAll() {
    return currencyUseCase.getAll();
  }
}
