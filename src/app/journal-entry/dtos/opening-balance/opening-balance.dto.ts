import { IExchangeRateDto } from '../../../money/dtos/exchange-rate/exchange-rate.dto';
import { IMoneyDto } from '../../../money/dtos/money/money.dto';

export interface IOpeningBalanceDto {
  amount: IMoneyDto;
  exchangeRate: IExchangeRateDto | null;
}
export interface IOpeningBalanceCreationReq extends IOpeningBalanceDto {
  accountId: string;
}
