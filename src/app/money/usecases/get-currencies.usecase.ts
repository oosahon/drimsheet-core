import ICurrencyRepo from '../../../domain/money/repos/currency.repo';
import IAppContext from '../../_internal/contracts/app-context.contract';
import { ICurrencyDto } from '../dtos/currency/currency.dto';

interface IDependencies {
  currencyRepo: ICurrencyRepo;
  appContext: IAppContext;
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
    const { correlationId } = deps.appContext.get();

    const res = await deps.currencyRepo.findAll({
      correlationId,
    });

    return res.map((currency) => ({
      ...currency,
      minorUnit: Number(currency.minorUnit),
    }));
  };
}
