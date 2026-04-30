import { SYSTEM_CURRENCIES } from '../../domain/currency/config/currencies.config';
import ICurrencyRepo from '../../domain/currency/repos/currency.repo';
import generateUUID from '../../shared/utils/uuid-generator';
import ILogger from '../contracts/infra/logger.contract';

export default async function bootstrapCurrencies(
  currencyRepo: ICurrencyRepo,
  logger: ILogger
) {
  const correlationId = `bootstrap-currencies-${generateUUID()}`;
  logger.info(`Bootstrapping currencies with correlation id ${correlationId}`);

  for (const currency of Object.values(SYSTEM_CURRENCIES)) {
    await currencyRepo.save(currency, {
      correlationId,
    });
  }

  logger.info('Currencies bootstrapped successfully');
}
