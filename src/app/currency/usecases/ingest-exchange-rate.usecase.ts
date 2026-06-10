import exchangeRateError from '../../../domain/currency/errors/exchange-rate.error';
import IExchangeRateRepo from '../../../domain/currency/repos/exchange-rate.repo';
import { UExchangeRateType } from '../../../domain/currency/types/exchange-rate.types';
import exchangeRateValue from '../../../domain/currency/value-objects/exchange-rate.vo';
import batchArray from '../../../shared/utils/batch-array';
import dateUtils from '../../../shared/utils/date';
import { IRepoService } from '../../shared/contracts/repo.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import IExchangeRateIngestion from '../contracts/exchange-rate-ingestion.contract';

export default function makeIngestExchangeRateUseCase(
  requestContext: IRequestContext,
  exchangeRateRepo: IExchangeRateRepo,
  repoService: IRepoService
) {
  return async (payload: IExchangeRateIngestion['message']['payload']) => {
    const { correlationId } = requestContext.get();

    const exchangeRates = payload.data.map((rate) =>
      exchangeRateValue.make({
        baseCurrencyCode: rate.base_currency_code,
        targetCurrencyCode: rate.target_currency_code,
        rate: Number(rate.rate),
        type: rate.rate_class as UExchangeRateType,
        asOf: dateUtils.fromString(rate.as_of, exchangeRateError.InvalidDate),
        source: rate.source,
      })
    );

    await repoService.runInTransaction(async (tx) => {
      const batches = batchArray(exchangeRates, 100);

      for (const batch of batches) {
        await exchangeRateRepo.save(batch, { correlationId, tx });
      }
    });
  };
}
