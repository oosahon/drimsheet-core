import ICurrencyRepo from '../../../domain/currency/repos/currency.repo';
import IRequestContext from '../../contracts/app/request-context.contract';

export default function getCurrenciesUseCase(
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
  return async () => {
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
