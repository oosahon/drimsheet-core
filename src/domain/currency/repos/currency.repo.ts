import {
  IReadRepoOptions,
  IWriteRepoOptions,
} from '../../../shared/types/repo.types';
import { ICurrency } from '../types/currency.types';

interface ICurrencyRepo {
  save(currency: ICurrency, option: IWriteRepoOptions): Promise<void>;

  findByCode(code: string, option: IReadRepoOptions): Promise<ICurrency | null>;

  findAll(option: IReadRepoOptions): Promise<ICurrency[]>;
}

export default ICurrencyRepo;
