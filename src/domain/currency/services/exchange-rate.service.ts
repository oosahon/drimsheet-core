import _ from 'lodash';
import { AppError } from '../../../shared/errors/error';
import generateDiff from '../../../shared/utils/diff-generator';
import IExchangeRateRepo from '../repos/exchange-rate.repo';
import IExchangeRateService from '../types/exchange-rate.service.types';
import exchangeRateValue from '../value-objects/exchange-rate.vo';

type TGetOfficialExchangeRate = IExchangeRateService['getOfficialExchangeRate'];
type TGetExchangeRate = IExchangeRateService['getExchangeRate'];

export default function makeExchangeRateService(
  repo: IExchangeRateRepo
): IExchangeRateService {
  const getOfficialExchangeRate: TGetOfficialExchangeRate = async (
    payload,
    repoOptions
  ) => {
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
  };

  const getExchangeRate: TGetExchangeRate = async (payload, repoOptions) => {
    if (payload === null) {
      return null;
    }
    return getOfficialExchangeRate(payload, repoOptions);
  };

  return Object.freeze({
    getOfficialExchangeRate,
    getExchangeRate,
  });
}
