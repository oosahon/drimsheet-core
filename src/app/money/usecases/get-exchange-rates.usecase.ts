import IExchangeRateRepo from '../../../domain/money/repos/exchange-rate.repo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IAppContext from '../../_internal/contracts/app-context.contract';
import { IExchangeRateQueryParam } from '../dtos/exchange-rate/exchange-rate.dto';
import { exchangeRateQueryParamValidation } from '../dtos/exchange-rate/exchange-rate.dto.validation';

interface IDependencies {
  appContext: IAppContext;
  exchangeRateRepo: IExchangeRateRepo;
}

export default function makeGetExchangeRateUseCase(deps: IDependencies) {
  return async (query: IExchangeRateQueryParam) => {
    zodValidationRunner(exchangeRateQueryParamValidation, query);

    const { correlationId } = deps.appContext.get();

    const response = await deps.exchangeRateRepo.find(query, { correlationId });

    return response;
  };
}
