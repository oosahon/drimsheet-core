import _ from 'lodash';
import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import generateDiff from '../../../shared/utils/diff-generator';
import { AppError } from '../../../shared/value-objects/error';
import IExchangeRateRepo from '../repos/exchange-rate.repo';
import { IExchangeRate } from '../types/exchange-rate.types';
import exchangeRateValue from '../value-objects/exchange-rate.vo';

interface IGetExchangeRatePayload extends TCreationOmits<
  IExchangeRate,
  'currencyPair'
> {
  id?: number;
}

export default function makeExchangeRateService(repo: IExchangeRateRepo) {
  return {
    async getExchangeRate(
      payload: IGetExchangeRatePayload,
      repoOptions: IRepoOptions
    ) {
      const { id, ...data } = payload;

      if (!id) {
        return exchangeRateValue.make(data);
      }

      const existing = await repo.getById(id, repoOptions);

      if (!existing) {
        throw new AppError('Exchange rate not found.', { cause: id });
      }

      const comparison = _.omit(existing, [
        'createdAt',
        'updatedAt',
        'id',
        'currencyPair',
      ]);

      const diff = generateDiff(comparison, data);

      if (diff.hasChanges) {
        throw new AppError('Official exchange rate cannot be altered.', {
          cause: diff,
        });
      }

      return existing;
    },
  };
}
