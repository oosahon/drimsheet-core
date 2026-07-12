import {
  IPaginatedReadRepoOptions,
  IReadRepoOptions,
  IWriteRepoOptions,
} from '../../../shared/types/repo.types';
import { IExchangeRate, UExchangeRateType } from '../types/exchange-rate.types';

interface IFindQuery {
  currencyPair: string;
  type?: UExchangeRateType;
  asOf?: Date;
}

interface IFindRepoOptions extends IPaginatedReadRepoOptions {
  orderBy: keyof IExchangeRate;
}

export default interface IExchangeRateRepo {
  create(
    exchangeRate: IExchangeRate[],
    option: IWriteRepoOptions
  ): Promise<void>;

  find(query: IFindQuery, options: IFindRepoOptions): Promise<IExchangeRate[]>;

  findByPairAndDate(
    currencyPair: string,
    asOf: Date,
    options: IReadRepoOptions
  ): Promise<IExchangeRate | null>;
}
