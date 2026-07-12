import { SYSTEM_CURRENCIES } from '../../../domain/currency/config/currencies.config';
import generateUUID from '../../../shared/utils/uuid-generator';
import observability from '../../observability';
import currencyRepos from '../../persistence/repos/currency';

export default async function bootstrapCurrencies() {
  const correlationId = `bootstrap-currencies-${generateUUID()}`;
  observability.logger.info(
    `Bootstrapping currencies with correlation id ${correlationId}`
  );

  for (const currency of Object.values(SYSTEM_CURRENCIES)) {
    await currencyRepos.currency.create(currency, {
      correlationId,
    });
  }

  observability.logger.info('Currencies bootstrapped successfully');
}
