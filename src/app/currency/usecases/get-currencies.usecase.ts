import ICurrencyRepo from '../../../domain/currency/repos/currency.repo';
import IRequestContext from '../../shared/contracts/request-context.contract';
import { ICurrencyDto } from '../dtos/currency/currency.dto';

interface IDependencies {
  currencyRepo: ICurrencyRepo;
  requestContext: IRequestContext;
}

export default function makeGetCurrenciesUseCase(deps: IDependencies) {
  /**
   * ========= USECASE EXECUTOR =========
   *
   * DOMAIN: global
   *
   * This usecase is used to get all supported currencies
   */
  return async (): Promise<ICurrencyDto[]> => {
    const { correlationId } = deps.requestContext.get();

    const res = await deps.currencyRepo.findAll({
      correlationId,
    });

    return res.map((currency) => ({
      ...currency,
      minorUnit: Number(currency.minorUnit),
    }));
  };
}
