import { SYSTEM_CURRENCIES } from '../../domain/currency/config/currencies.config';
import observability from '../../infra/observability';
import repos from '../../infra/persistence/repos';
import generateUUID from '../../shared/utils/uuid-generator';

export default async function bootstrapCurrencies() {
  const correlationId = `bootstrap-currencies-${generateUUID()}`;
  observability.logger.info(
    `Bootstrapping currencies with correlation id ${correlationId}`
  );

  for (const currency of Object.values(SYSTEM_CURRENCIES)) {
    await repos.currency.save(currency, {
      correlationId,
    });
  }

  observability.logger.info('Currencies bootstrapped successfully');
}
