import makeAccountingService from '../../../domain/accounting/services/accounting.service';
import {
  EJournalEntryStatus,
  IJournalEntry,
} from '../../../domain/journal-entry/types/journal-entry.types';
import { IJournalLine } from '../../../domain/journal-entry/types/journal-line.types';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { TEntityId } from '../../../shared/types/uuid';
import IRequestContext from '../../contracts/app/request-context.contract';
import { ILedgerAccountBalanceAdjustmentDto } from '../../contracts/dto/workers.dto';
import IQueue from '../../contracts/infra/queues.contract';

export default function makeEnqueueBalanceAdjustmentsUseCase(
  requestContext: IRequestContext,
  ledgerAccountRepo: ILedgerAccountRepo,
  queue: IQueue
) {
  const domainServices = {
    accounting: makeAccountingService(ledgerAccountRepo),
  };

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
        await domainServices.accounting.getBalanceEffectDelta(
          accountId,
          lines,
          repoOptions
        );

      allAdjustments.push({
        journalEntry: {
          id: journalEntry.id,
          transactionId: journalEntry.transactionId,
          createdBy: journalEntry.createdBy,
        },
        correlationId,
        balanceDelta: balanceEffectDelta.balanceDelta,
        functionalBalanceDelta: balanceEffectDelta.functionalBalanceDelta,
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
