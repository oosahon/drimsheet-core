import bootstrapObservability from '@infra/runtime/_bootstrap/observability.bootstrap';

async function startExchangeRateIngestion(): Promise<void> {
  const { default: exchangeRateIngestionRuntime } =
    await import('@infra/runtime/exchange-rate-ingestion');

  process.exitCode = await exchangeRateIngestionRuntime.run();
}

bootstrapObservability();
void startExchangeRateIngestion();
