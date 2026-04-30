import { IRepoOptions } from '../../../shared/types/repo.types';
import { ICurrency } from '../types/currency.types';

interface ICurrencyRepo {
  save(currency: ICurrency, option: IRepoOptions): Promise<void>;

  findByCode(code: string, option: IRepoOptions): Promise<ICurrency | null>;

  findAll(option: IRepoOptions): Promise<ICurrency[]>;
}

export default ICurrencyRepo;
