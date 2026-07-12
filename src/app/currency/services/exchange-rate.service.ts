import IExchangeRateRepo from '../../../domain/currency/repos/exchange-rate.repo';
import { EExchangeRateType } from '../../../domain/currency/types/exchange-rate.types';
import IExchangeRateAppService from '../contracts/exchange-rate.service.contract';

export default function makeExchangeRateAppService(
  repo: IExchangeRateRepo
): IExchangeRateAppService {
  return {
    async getOfficialRate(pair, asOf, repoOptions, userProvided) {
      if (userProvided?.type === EExchangeRateType.Official) {
        return userProvided;
      }

      return repo.findByPairAndDate(pair, asOf, repoOptions);
    },
  };
}
