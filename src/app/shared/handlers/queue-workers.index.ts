import internalMailer from '../../../infra/config/internal-mailer.config';
import { NODE_ENV } from '../../../infra/config/vars.config';
import zeptoMail from '../../../infra/config/zeptomail.config';
import observability from '../../../infra/observability';
import makeLedgerAccountBalanceAdjustmentWorker from '../../bookkeeping/handlers/ledger-account-balance-adjustment.worker';
import makeExchangeRateIngestionWorker from '../../currency/handlers/exchange-rate-ingestion.worker';
import appContext from '../context';
import makeTransactionalEmailWorker from './transactional-email.worker';

const mailer = NODE_ENV === 'test' ? internalMailer : zeptoMail.notifications;

const workers = {
  transactionalEmail: makeTransactionalEmailWorker(mailer),

  ledgerAccountBalanceAdjustment: makeLedgerAccountBalanceAdjustmentWorker(
    observability.logger
  ),

  exchangeRateIngestion: makeExchangeRateIngestionWorker(
    observability.reporter,
    appContext.request,
    observability.logger
  ),
};

export default workers;
