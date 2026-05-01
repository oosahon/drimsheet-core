import _ from 'lodash';
import generateDiff from '../../../shared/utils/diff-generator';
import exchangeRateError from '../errors/exchange-rate.error';
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
      throw new exchangeRateError.NotFound({ id });
    }

    const comparison = _.omit(existing, [
      'createdAt',
      'updatedAt',
      'id',
      'currencyPair',
    ]);

    const diff = generateDiff(comparison, data);

    if (diff.hasChanges) {
      throw new exchangeRateError.UpdateNotPermitted({
        diff,
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
