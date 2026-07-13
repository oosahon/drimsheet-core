import IExchangeRateRepo from '../../../domain/money/repos/exchange-rate.repo';
import { EExchangeRateType } from '../../../domain/money/types/exchange-rate.types';
import IExchangeRateAppService from '../contracts/exchange-rate.service.contract';

interface IDependencies {
  exchangeRateRepo: IExchangeRateRepo;
}

export default function makeExchangeRateAppService(
  deps: IDependencies
): IExchangeRateAppService {
  return {
    async getOfficialRate(pair, asOf, repoOptions, userProvided) {
      if (userProvided?.type === EExchangeRateType.Official) {
        return userProvided;
      }

      return deps.exchangeRateRepo.findByPairAndDate(pair, asOf, repoOptions);
    },
  };
}
