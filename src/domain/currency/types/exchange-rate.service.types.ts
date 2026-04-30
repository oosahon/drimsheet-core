import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { IRepoOptions } from '../../../shared/types/repo.types';
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
    repoOptions: IRepoOptions
  ): Promise<IExchangeRate>;

  getExchangeRate(
    payload: IGetExchangeRatePayload | null,
    repoOptions: IRepoOptions
  ): Promise<IExchangeRate | null>;
}
