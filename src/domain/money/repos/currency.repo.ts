import { IReadRepoOptions, IWriteRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import { ICurrency } from '@domain/money/types/currency.types';

interface ICurrencyRepo {
  create(
    currency: ICurrency,
    createdBy: TEntityId,
    option: IWriteRepoOptions
  ): Promise<void>;

  findByCode(code: string, option: IReadRepoOptions): Promise<ICurrency | null>;

  findAll(option: IReadRepoOptions): Promise<ICurrency[]>;
}

export default ICurrencyRepo;
