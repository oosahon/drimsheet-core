import ledgerAccountHistoryMapper from '../../../../app/ledger/mappers/ledger-account-history.mapper';
import ILedgerAccountHistoryRepo from '../../../../domain/ledger/repos/ledger-account-history.repo';
import { ledgerAccountHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../helpers/query';

const ledgerAccountHistoryRepo: ILedgerAccountHistoryRepo = {
  save: async (histories, options) => {
    await getDbQuery(options)
      .insert(ledgerAccountHistoryInAudit)
      .values(histories.map(ledgerAccountHistoryMapper.toRepo));
  },
};

export default ledgerAccountHistoryRepo;
