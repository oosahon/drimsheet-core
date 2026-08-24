import zodValidationRunner from '@shared/utils/zod-validation-runner';

import IExchangeRateRepo from '@domain/money/repos/exchange-rate.repo';

import IAppContext from '@app/context/contracts/app-context.contract';
import { IExchangeRateQueryParam } from '@app/money/dtos/exchange-rate/exchange-rate.dto';
import { getExchangeRatesQueryValidationSchema } from '@app/money/dtos/exchange-rate/exchange-rate.dto.validation';

interface IDependencies {
  appContext: IAppContext;
  exchangeRateRepo: IExchangeRateRepo;
}

export default function makeGetExchangeRateUseCase(deps: IDependencies) {
  return async (query: IExchangeRateQueryParam) => {
    zodValidationRunner(getExchangeRatesQueryValidationSchema, query);

    const { correlationId } = deps.appContext.get();

    const response = await deps.exchangeRateRepo.find(query, { correlationId });

    return response;
  };
}
