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

import { IExchangeRateQueryParam } from '@app/money/dtos/exchange-rate/exchange-rate.dto';

import middlewares from '@infra/ioc/middlewares/http';
import {
  getAllCurrenciesUseCase,
  getExchangeRateUseCase,
} from '@infra/ioc/usecases/money';

@Route('currencies')
@Tags('Currency')
export class CurrencyController extends Controller {
  /**
   * Gets all system currencies
   */
  @Get('/')
  @OperationId('getAllCurrencies')
  @SuccessResponse('200')
  @Middlewares(middlewares.isOptionalAuthenticatedUser)
  public async getAllCurrencies() {
    return getAllCurrenciesUseCase();
  }

  /**
   * Gets all system exchange
   */
  @Get('/exchange-rates')
  @OperationId('getExchangeRates')
  @SuccessResponse('200')
  public async getExchangeRates(@Queries() query: IExchangeRateQueryParam) {
    return getExchangeRateUseCase(query);
  }
}
