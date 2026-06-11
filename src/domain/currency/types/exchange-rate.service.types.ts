import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { IExchangeRate } from './exchange-rate.types';

export interface IGetExchangeRatePayload extends TCreationOmits<
  IExchangeRate,
  'currencyPair'
> {
  id?: number;
}

export default interface IExchangeRateService {
  getOfficialExchangeRate(
    payload: IGetExchangeRatePayload,
    repoOptions: IReadRepoOptions
  ): Promise<IExchangeRate>;

  getExchangeRate(
    payload: IGetExchangeRatePayload | null,
    repoOptions: IReadRepoOptions
  ): Promise<IExchangeRate | null>;
}
