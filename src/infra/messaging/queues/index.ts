import IQueue, {
  EQueueName,
} from '../../../app/shared/contracts/queues.contract';
import reporter from '../../observability/reporter';
import {
  getConfig as getLedgerAccountBalanceAdjustmentQueueConfig,
  ledgerAccountBalanceAdjustmentQueue,
} from '../queues/ledger-account-balance.queue';
import {
  getConfig as getTransactionalEmailQueueConfig,
  transactionalEmailQueue,
} from '../queues/transactional-email.queue';

const queue: IQueue = {
  async addTransactionalEmail(payload) {
    try {
      await transactionalEmailQueue.add(
        EQueueName.TransactionalEmail,
        payload,
        getTransactionalEmailQueueConfig(payload)
      );
    } catch (error) {
      reporter.report(error, { job: payload });
    }
  },

  async addLedgerAccountBalanceAdjustment(payload) {
    try {
      await ledgerAccountBalanceAdjustmentQueue.add(
        EQueueName.LedgerAccountBalanceAdjustment,
        payload,
        getLedgerAccountBalanceAdjustmentQueueConfig(payload)
      );
    } catch (error) {
      reporter.report(error, { job: payload });
    }
  },
};

export { ledgerAccountBalanceAdjustmentQueue, transactionalEmailQueue };

export default queue;
