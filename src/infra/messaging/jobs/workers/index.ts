import ledgerAccountBalanceAdjustmentWorker from './ledger-account-balance-adjustment.worker';
import transactionalEmailWorker from './transactional-email.worker';

function registerWorkers() {
  try {
    transactionalEmailWorker();
    ledgerAccountBalanceAdjustmentWorker();
  } catch (error) {
    console.error('Failed to register workers', error);
  }
}

export default registerWorkers;
