import {
  Controller,
  Get,
  Middlewares,
  OperationId,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';
import currencyUseCase from '../../../app/usecases/currency';
import middlewares from '../middlewares';

@Route('currencies')
@Tags('Currency')
export class CurrencyController extends Controller {
  /**
   * Gets all system currencies
   */
  @Get('/')
  @OperationId('getCurrencies')
  @SuccessResponse('200')
  @Middlewares(middlewares.isOptionalAuthenticatedUser)
  public async getCurrencies() {
    return currencyUseCase.getAll();
  }
}
