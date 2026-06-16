import IJournalEntryService from '../../../domain/journal-entry/types/journal-entry.service.types';
import {
  EJournalEntryStatus,
  IJournalEntry,
} from '../../../domain/journal-entry/types/journal-entry.types';
import { IJournalLine } from '../../../domain/journal-entry/types/journal-line.types';
import IQueue from '../../../shared/contracts/queues.contract';
import IRequestContext from '../../../shared/contracts/request-context.contract';
import { TEntityId } from '../../../shared/types/uuid';
import { ILedgerAccountBalanceAdjustmentDto } from '../../ledger/dtos/ledger-account-balance-adjustment.dto';
import moneyMapper from '../../shared/mappers/money.mapper';

export default function makeEnqueueBalanceAdjustmentsUseCase(
  requestContext: IRequestContext,
  queue: IQueue,
  journalEntryService: IJournalEntryService
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
      const balanceEffectDelta =
        await journalEntryService.getBalanceEffectDelta(
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
