import { IWriteRepoOptions } from '../../../shared/types/repo.types';
import { IExchangeRate } from '../types/exchange-rate.types';

export default interface IExchangeRateRepo {
  create(
    exchangeRate: IExchangeRate[],
    option: IWriteRepoOptions
  ): Promise<void>;
}
