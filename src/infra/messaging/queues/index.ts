import observability from '@infra/observability';

import makeLedgerAccountBalanceAdjustmentQueue from './ledger-account-balance.queue';
import makeTransactionalEmailQueue from './transactional-email.queue';

const queues = Object.freeze({
  ledgerBalanceAdjustment: makeLedgerAccountBalanceAdjustmentQueue(
    observability.reporter,
    observability.queueMetrics
  ),

  transactionalEmail: makeTransactionalEmailQueue(
    observability.reporter,
    observability.queueMetrics
  ),
});

export default queues;
