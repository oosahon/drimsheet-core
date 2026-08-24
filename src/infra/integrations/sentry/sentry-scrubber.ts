import scrubSentryEvent from './sentry-event-scrubber';
import scrubSentrySpan from './sentry-span-scrubber';
import scrubSentryTransaction from './sentry-transaction-scrubber';

const sentryScrubber = Object.freeze({
  event: scrubSentryEvent,
  span: scrubSentrySpan,
  transaction: scrubSentryTransaction,
});

export default sentryScrubber;
