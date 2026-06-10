// Generated from src/app/currency/contracts/exchange-rate-ingestion.contract.json. Do not modify directly.

export default interface IExchangeRateIngestion {
  channel: {
    exchange: string;
    routing_key: string;
  };
  message: {
    payload: {
      correlation_id: string;
      event_type: 'exchange-rate.ingested.v1';
      occurred_at: string;
      producer: 'pl-ingestion';
      data: Array<{
        base_currency_code: string;
        target_currency_code: string;
        rate: string;
        rate_class: 'official' | 'market';
        as_of: string;
        source: string;
      }>;
    };
  };
}
