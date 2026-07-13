import {
  Controller,
  Get,
  Middlewares,
  OperationId,
  Queries,
  Route,
  SuccessResponse,
  Tags,
} from 'tsoa';
import { IExchangeRateQueryParam } from '../../../app/money/dtos/exchange-rate/exchange-rate.dto';
import {
  currencyUseCase,
  exchangeRateUseCases,
} from '../../../infra/ioc/usecases/money.usecases';
import middlewares from '../middlewares';

@Route('money')
@Tags('Money')
export class MoneyController extends Controller {
  /**
   * Gets all system currencies
   */
  @Get('/currencies')
  @OperationId('getAllCurrencies')
  @SuccessResponse('200')
  @Middlewares(middlewares.isOptionalAuthenticatedUser)
  public async getAllCurrencies() {
    return currencyUseCase.getAll();
  }

  /**
   * Gets all system exchange
   */
  @Get('/exchange-rates')
  @OperationId('getExchangeRates')
  @SuccessResponse('200')
  @Middlewares(middlewares.isAuthenticatedUser)
  public async getExchangeRates(@Queries() query: IExchangeRateQueryParam) {
    return exchangeRateUseCases.get(query);
  }
}
