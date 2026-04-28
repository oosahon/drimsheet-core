import { IRepoOptions } from '../../../shared/types/repo.types';
import { IExchangeRate } from '../types/exchange-rate.types';

export default interface IExchangeRateRepo {
  save(exchangeRate: IExchangeRate, option: IRepoOptions): Promise<void>;

  getById(id: number, option: IRepoOptions): Promise<IExchangeRate | null>;
}
