import _ from 'lodash';
import generateUUID from '../../../shared/utils/uuid-generator';
import ILogger from '../../shared/contracts/logger.contract';
import IReporter from '../../shared/contracts/reporter.contract';
import IRequestContext, {
  IRequestContextData,
} from '../../shared/contracts/request-context.contract';
import IExchangeRateIngestion from '../contracts/exchange-rate-ingestion.contract';
import currencyUseCase from '../usecases';

export default function makeExchangeRateIngestionWorker(
  reporter: IReporter,
  requestContext: IRequestContext,
  logger: ILogger
) {
  return async (payload: IExchangeRateIngestion['message']['payload']) => {
    console.log('>>>>>>>>>>>>>>>>>>>', _.omit(payload, ['data']));
    try {
      logger.info('Initiating currency exchange rate ingestion');

      const { correlation_id } = payload;

      if (!correlation_id) {
        logger.warn(
          'Exchange rate ingestion message was sent without a correlation_id'
        );
      }

      const storeInitialState = {
        getCorrelationId: correlation_id || generateUUID(),
      } as unknown as IRequestContextData;

      requestContext.init(
        storeInitialState,
        async () => await currencyUseCase.ingest(payload).catch(reporter.report)
      );

      logger.info('Currency exchange rate ingested successfully');
    } catch (error) {
      reporter.report(error, { context: 'Failed to ingest exchange rate' });
    }
  };
}
