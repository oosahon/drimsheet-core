# Exchange Rate RabbitMQ Consumer Implementation Plan

## Goal

Wire the exchange-rate ingestion RabbitMQ consumer into application startup so
messages matching
`src/app/currency/contracts/exchange-rate-ingestion.contract.json` are passed to
`currencyUseCase.ingest()`.

## Existing Components

- Contract:
  `src/app/currency/contracts/exchange-rate-ingestion.contract.json`
- Generated TypeScript contract:
  `src/app/currency/contracts/exchange-rate-ingestion.contract.ts`
- Use case:
  `src/app/currency/usecases/ingest-exchange-rate.usecase.ts`
- Application consumer placeholder:
  `src/app/currency/handlers/exchange-rate-ingestion.consumer.ts`
- RabbitMQ configuration placeholder:
  `src/infra/config/rabbitmq.config.ts`
- RabbitMQ adapter placeholder:
  `src/infra/messaging/external/exchange-rate.consumer.ts`
- Existing worker composition:
  `src/app/shared/handlers/queue-workers.index.ts`
- Existing worker registration:
  `src/infra/messaging/workers/index.ts`

## Proposed Changes

### 1. Application Consumer

Implement
`src/app/currency/handlers/exchange-rate-ingestion.consumer.ts` as a worker
factory.

Dependencies:

- `ILogger`

Behavior:

1. Accept an `IExchangeRateIngestion` payload.
2. Call `currencyUseCase.ingest(payload)`.
3. On failure, log the failure with useful ingestion context.
4. Rethrow the error so the RabbitMQ adapter can reject the message.

This layer will not contain RabbitMQ-specific types or acknowledgement logic.

### 2. Application Worker Export

Update `src/app/shared/handlers/queue-workers.index.ts` to construct and export
the exchange-rate consumer alongside the existing BullMQ workers.

Proposed worker key:

```ts
exchangeRateIngestion;
```

The worker will receive `observability.logger`, following the existing
ledger-account balance worker pattern.

### 3. Queue Name

Update `src/app/shared/contracts/queues.contract.ts` to add the RabbitMQ
consumer queue to the existing `EQueueName` registry:

```ts
ExchangeRateIngestion: 'pl-core.exchange-rate-ingestion.v1',
```

The RabbitMQ adapter will use `EQueueName.ExchangeRateIngestion`, following the
project's existing convention for queue names.

### 4. RabbitMQ Environment Configuration

Update `src/infra/config/vars.config.ts` to export:

- `RABBITMQ_URL`

Only the RabbitMQ connection URL is environment-specific. Queue topology must
be deterministic and owned by the application.

The exchange and routing key are part of the producer/consumer contract and
must not be environment variables. The RabbitMQ adapter will import
`exchange` and `routing_key` directly from
`src/app/currency/contracts/exchange-rate-ingestion.contract.json`.

Update `.env.example` to remove `RABBITMQ_EXCHANGE` and
`RABBITMQ_ROUTING_KEY`, and `RABBITMQ_FX_QUEUE`.

`RABBITMQ_URL` should not contain a production credential default.

### 5. RabbitMQ Connection Configuration

Implement `src/infra/config/rabbitmq.config.ts`.

Responsibilities:

1. Open an `amqplib` connection using `RABBITMQ_URL`.
2. Create a channel.
3. Return the channel to the external consumer registration layer.
4. Avoid opening a connection when the module is merely imported.

The connection should be created during application bootstrap so connection
failures participate in the existing bootstrap error handling.

### 6. Queue Declaration and Consumer Adapter

Implement `src/infra/messaging/external/exchange-rate.consumer.ts`.

Registration behavior:

1. Create a RabbitMQ channel.
2. Import the exchange and routing key from
   `exchange-rate-ingestion.contract.json`.
3. Assert the contract's exchange as a durable `direct` exchange.
4. Assert `EQueueName.ExchangeRateIngestion` as durable.
5. Bind the queue using the contract's routing key.
6. Set `prefetch(1)` initially to avoid concurrent writes through the shared
   request context.
7. Register a consumer with manual acknowledgements.

Message handling:

1. Ignore RabbitMQ cancellation callbacks where the message is `null`.
2. Parse `message.content` as UTF-8 JSON.
3. Pass the parsed payload to `workers.exchangeRateIngestion`.
4. Call `channel.ack(message)` after successful ingestion.
5. Report parse or ingestion failures with message metadata.
6. Reject failed messages according to the failure policy below.

### 7. Failure Policy

Proposed policy: dead-letter failed messages rather than dropping them or
requeueing forever.

Additional queue setup:

- Dead-letter exchange:
  `<contract.exchange>.dead-letter`
- Dead-letter queue:
  `<EQueueName.ExchangeRateIngestion>.dead-letter`
- Dead-letter routing key:
  `<contract.routing_key>.dead-letter`

The main queue will be declared with dead-letter exchange and routing-key
arguments. Failed messages will use:

```ts
channel.nack(message, false, false);
```

This gives operators a durable record of malformed messages and permanent
ingestion failures without creating an infinite retry loop.

Decision required:

- Approve the proposed dead-letter queue.
- Or use `nack(message, false, true)` for immediate requeueing.
- Or reject failed messages without retaining them.

### 8. Worker Registration and Bootstrap

Update `src/infra/messaging/workers/index.ts`:

1. Keep the existing BullMQ registrations.
2. Register the RabbitMQ exchange-rate consumer.
3. Make `workerRegistration` asynchronous.
4. Await RabbitMQ registration so setup errors reach the existing reporter.

Update `src/app/_bootstrap/index.ts`:

```ts
await registerWorkers(observability.reporter);
```

This ensures the application does not report a completed bootstrap before the
RabbitMQ consumer is ready.

## Tests

### Application Consumer Spec

Create:

`src/app/currency/handlers/__specs__/exchange-rate-ingestion.consumer.spec.ts`

Cases:

1. Calls `currencyUseCase.ingest()` with the complete payload.
2. Logs and rethrows when the use case fails.

### RabbitMQ Adapter Spec

Create:

`src/infra/messaging/external/__specs__/exchange-rate.consumer.spec.ts`

Mock the RabbitMQ channel/config boundary and verify:

1. Durable exchange declaration.
2. Durable main queue declaration.
3. Queue binding with the contract's routing key.
4. Prefetch and consumer registration.
5. Valid JSON is passed to the application worker.
6. Successful processing acknowledges the message.
7. Invalid JSON is reported and rejected.
8. Worker failures are reported and rejected.
9. A `null` delivery is ignored.
10. Dead-letter declarations and queue arguments, if that policy is approved.

### Existing Configuration Spec

Update `src/infra/config/__specs__/vars.config.spec.ts` to cover the RabbitMQ
URL default and environment override. Exchange, routing key, and queue-name
tests belong to the RabbitMQ adapter spec because those topology values are
owned by the contract and application code.

## Verification

Run:

```sh
npx jest \
  src/app/currency/handlers/__specs__/exchange-rate-ingestion.consumer.spec.ts \
  src/infra/messaging/external/__specs__/exchange-rate.consumer.spec.ts \
  src/infra/config/__specs__/vars.config.spec.ts

npx tsc --noEmit

npm run build
```

If focused verification passes, run the full test suite:

```sh
npm test
```

## Files Expected to Change

- `.env.example`
- `src/app/_bootstrap/index.ts`
- `src/app/currency/handlers/exchange-rate-ingestion.consumer.ts`
- `src/app/shared/contracts/queues.contract.ts`
- `src/app/shared/handlers/queue-workers.index.ts`
- `src/infra/config/rabbitmq.config.ts`
- `src/infra/config/vars.config.ts`
- `src/infra/config/__specs__/vars.config.spec.ts`
- `src/infra/messaging/external/exchange-rate.consumer.ts`
- `src/infra/messaging/workers/index.ts`

## Files Expected to Be Created

- `src/app/currency/handlers/__specs__/exchange-rate-ingestion.consumer.spec.ts`
- `src/infra/messaging/external/__specs__/exchange-rate.consumer.spec.ts`

No implementation files will be changed until this plan is approved.
