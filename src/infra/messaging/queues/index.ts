import reporter from '@infra/observability/reporter';

import makeLedgerAccountBalanceAdjustmentQueue from './ledger-account-balance.queue';
import makeTransactionalEmailQueue from './transactional-email.queue';

const queues = Object.freeze({
  ledgerBalanceAdjustment: makeLedgerAccountBalanceAdjustmentQueue(reporter),

  transactionalEmail: makeTransactionalEmailQueue(reporter),
});

export default queues;
