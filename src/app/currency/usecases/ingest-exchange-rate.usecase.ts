import exchangeRateError from '../../../domain/currency/errors/exchange-rate.error';
import IExchangeRateRepo from '../../../domain/currency/repos/exchange-rate.repo';
import { UExchangeRateType } from '../../../domain/currency/types/exchange-rate.types';
import exchangeRateValue from '../../../domain/currency/value-objects/exchange-rate.vo';
import ILogger from '../../../shared/contracts/logger.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import batchArray from '../../../shared/utils/batch-array';
import dateUtils from '../../../shared/utils/date';
import generateUUID from '../../../shared/utils/uuid-generator';
import IExchangeRateIngestion from '../contracts/exchange-rate-ingestion.contract';

export default function makeIngestExchangeRateUseCase(
  exchangeRateRepo: IExchangeRateRepo,
  repoService: IRepoService,
  logger: ILogger
) {
  return async (payload: IExchangeRateIngestion['message']['payload']) => {
    const { correlation_id } = payload;

    if (!correlation_id) {
      logger.warn(
        'Exchange rate ingestion message was sent without a correlation_id'
      );
    }
    const correlationId = correlation_id || generateUUID();

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

    const transactionFn: TRepoTransactionFn = async (tx) => {
      const batches = batchArray(exchangeRates, 100);
      for (const batch of batches) {
        await exchangeRateRepo.create(batch, { tx, correlationId });
      }
    };

    await repoService.runInTransaction(transactionFn);
  };
}
