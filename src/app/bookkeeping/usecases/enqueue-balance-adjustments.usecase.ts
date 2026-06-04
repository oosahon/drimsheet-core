import IBookkeepingService from '../../../domain/bookkeeping/types/bookkeeping.service.types';
import {
  EJournalEntryStatus,
  IJournalEntry,
} from '../../../domain/journal-entry/types/journal-entry.types';
import { IJournalLine } from '../../../domain/journal-entry/types/journal-line.types';
import { TEntityId } from '../../../shared/types/uuid';
import IQueue from '../../shared/contracts/queues.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import { ILedgerAccountBalanceAdjustmentDto } from '../../shared/dtos/workers.dto';
import moneyMapper from '../../shared/mappers/money.mapper';

export default function makeEnqueueBalanceAdjustmentsUseCase(
  requestContext: IRequestContext,
  queue: IQueue,
  bookkeepingService: IBookkeepingService
) {
  return async (journalEntry: IJournalEntry) => {
    if (journalEntry.status === EJournalEntryStatus.Draft) return;

    const { correlationId } = requestContext.get();

    const accountMap = new Map<TEntityId, IJournalLine[]>();

    journalEntry.lines.forEach((line) => {
      const accountLines = accountMap.get(line.accountId);

      if (accountLines) {
        accountLines.push(line);
      } else {
        accountMap.set(line.accountId, [line]);
      }
    });

    const allAdjustments: ILedgerAccountBalanceAdjustmentDto[] = [];

    const repoOptions = { correlationId };

    for (const [accountId, lines] of accountMap.entries()) {
      const balanceEffectDelta = await bookkeepingService.getBalanceEffectDelta(
        accountId,
        lines,
        repoOptions
      );

      allAdjustments.push({
        journalEntry: {
          id: journalEntry.id,
          createdBy: journalEntry.createdBy,
        },
        correlationId,
        balanceDelta: moneyMapper.toDto(balanceEffectDelta.balanceDelta),
        functionalBalanceDelta: moneyMapper.toDto(
          balanceEffectDelta.functionalBalanceDelta
        ),
        ledgerAccountId: accountId,
      });
    }

    await Promise.all(
      allAdjustments.map((adjustment) =>
        queue.addLedgerAccountBalanceAdjustment(adjustment)
      )
    );
  };
}
