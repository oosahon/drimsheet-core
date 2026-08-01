import { UExchangeRateType } from '../../../../domain/money/types/exchange-rate.types';
import { IPaginationDto } from '../../../../shared/values/pagination/dto/pagination.dto';

export interface IExchangeRateDto {
  baseCurrencyCode: string;
  targetCurrencyCode: string;
  rate: number;
  type: UExchangeRateType;
  asOf: Date;
  source: string;
}

export interface IExchangeRateQueryParam extends Omit<
  IPaginationDto,
  'search' | 'sortDirection'
> {
  currencyPair: string;
  type?: UExchangeRateType;
  asOf?: Date;
}
