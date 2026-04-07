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

export interface ICurrencyResponse {
  code: string;
  symbol: string;
  name: string;
  minorUnit: number;
}

@Route('currencies')
@Tags('Currency')
export class CurrencyController extends Controller {
  /**
   * Get Currencies
   */
  @Get('/')
  @OperationId('getCurrencies')
  @SuccessResponse('200')
  @Middlewares(middlewares.isOptionalAuthenticatedUser)
  public async getCurrencies() {
    return currencyUseCase.getAll();
  }
}
