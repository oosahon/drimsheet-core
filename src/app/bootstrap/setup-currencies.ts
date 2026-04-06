import ICurrencyRepo from '../../domain/currency/repos/currency.repo';
import generateUUID from '../../shared/utils/uuid-generator';
import ILogger from '../contracts/infra/logger.contract';
import { SYSTEM_CURRENCIES } from './data/currencies';

export default async function bootstrapCurrencies(
  currencyRepo: ICurrencyRepo,
  logger: ILogger
) {
  try {
    const correlationId = `bootstrap-currencies-${generateUUID()}`;
    logger.info(
      `Bootstrapping currencies with correlation id ${correlationId}`
    );

    for (const currency of SYSTEM_CURRENCIES) {
      await currencyRepo.save(currency, {
        correlationId,
      });
    }

    logger.info('Currencies bootstrapped successfully');
  } catch (error) {
    logger.error('Failed to bootstrap currencies', error);
  }
}
