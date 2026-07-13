import { IExchangeRateDto } from '../../../currency/dtos/exchange-rate/exchange-rate.dto';
import { IMoneyDto } from '../../../shared/dtos/money/money.dto';

export interface IOpeningBalanceDto {
  amount: IMoneyDto;
  exchangeRate: IExchangeRateDto | null;
}
export interface IOpeningBalanceCreationReq extends IOpeningBalanceDto {
  accountId: string;
}
