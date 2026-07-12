import { IExchangeRate } from '../../../domain/currency/types/exchange-rate.types';
import { IReadRepoOptions } from '../../../shared/types/repo.types';

export default interface IExchangeRateAppService {
  getOfficialRate(
    pair: string,
    asOf: Date,
    repoOptions: IReadRepoOptions,
    userProvided: IExchangeRate | null
  ): Promise<IExchangeRate | null>;
}
