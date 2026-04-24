import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { IExchangeRate } from '../types/exchange-rate.types';

export default interface IExchangeRateRepo {
  save(exchangeRate: IExchangeRate, option: IRepoOptions): Promise<void>;

  getById(id: number, option: IRepoOptions): Promise<IExchangeRate | null>;
}
