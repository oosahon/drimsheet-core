import ICurrencyRepo from '../../../domain/currency/repos/currency.repo';
import IRequestContext from '../../shared/contracts/request-context.contract';
import { ICurrencyDto } from '../../shared/dtos/money.dto';

export default function makeGetCurrenciesUseCase(
  currencyRepo: ICurrencyRepo,
  requestContext: IRequestContext
) {
  /**
   * ========= USECASE EXECUTOR =========
   *
   * DOMAIN: global
   *
   * This usecase is used to get all supported currencies
   */
  return async (): Promise<ICurrencyDto[]> => {
    const { correlationId } = requestContext.get();

    const res = await currencyRepo.findAll({
      correlationId,
    });

    return res.map((currency) => ({
      ...currency,
      minorUnit: Number(currency.minorUnit),
    }));
  };
}
