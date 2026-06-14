import journalLineHistoryMapper from '../../../../app/journal-entry/mappers/journal-line-history.mapper';
import journalLineError from '../../../../domain/journal-entry/errors/journal-line.error';
import IJournalLineHistoryRepo from '../../../../domain/journal-entry/repos/journal-line-history.repo';
import { journalLineHistoryInAudit } from '../../../config/drizzle/schema';
import getDbQuery from '../helpers/query';

const journalLineHistoryRepo: IJournalLineHistoryRepo = {
  save: async (payload, historyPayload, accountingEntityId, options) => {
    const lines = Array.isArray(payload) ? payload : [payload];
    const histories = Array.isArray(historyPayload)
      ? historyPayload
      : [historyPayload];
    const historyByLineId = new Map(
      histories.map((history) => [history.entityId, history])
    );

    const values = lines.map((line) => {
      const history = historyByLineId.get(line.id);

      if (!history) {
        throw new journalLineError.MissingHistory({
          id: line.id,
          correlationId: options.correlationId,
        });
      }

      return journalLineHistoryMapper.toRepo(line, history, accountingEntityId);
    });

    await getDbQuery(options).insert(journalLineHistoryInAudit).values(values);
  },
};

export default journalLineHistoryRepo;
