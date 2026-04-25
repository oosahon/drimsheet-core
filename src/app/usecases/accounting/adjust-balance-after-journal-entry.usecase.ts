import ILedgerAccountBalanceRepo from '../../../domain/accounting/repos/ledger-account-balance.repo';
import makeLedgerAccountBalanceService from '../../../domain/accounting/services/account-balance.service';
import makeAccountingService from '../../../domain/accounting/services/accounting.service';
import { INewLedgerAccountBalanceAndAdjustment } from '../../../domain/accounting/types/ledger-account-balance.types';
import {
  EJournalEntryStatus,
  IJournalEntry,
} from '../../../domain/journal-entry/types/journal-entry.types';
import { IJournalLine } from '../../../domain/journal-entry/types/journal-line.types';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { TEntityId } from '../../../shared/types/uuid';
import IRequestContext from '../../contracts/app/request-context.contract';
import { IQueue } from '../../contracts/infra/queues.contract';
import ledgerAccountBalanceMapper from '../../mappers/ledger-account-balance.mapper';

export default function makeAdjustBalanceAfterJournalEntryUseCase(
  requestContext: IRequestContext,
  ledgerAccountRepo: ILedgerAccountRepo,
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo,
  queue: IQueue
) {
  const domainServices = {
    accounting: makeAccountingService(ledgerAccountRepo),
    accountBalance: makeLedgerAccountBalanceService(
      ledgerAccountBalanceRepo,
      ledgerAccountRepo
    ),
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

    const allAdjustments: INewLedgerAccountBalanceAndAdjustment[] = [];

    const repoOptions = { correlationId };

    for (const [accountId, lines] of accountMap.entries()) {
      const balanceEffectDelta =
        await domainServices.accounting.getBalanceEffectDelta(
          accountId,
          lines,
          repoOptions
        );

      const balanceAdjustments =
        await domainServices.accountBalance.makeRecursiveAdjustments(
          {
            ...balanceEffectDelta,
            journalEntry,
          },
          repoOptions
        );

      allAdjustments.push(...balanceAdjustments);
    }

    allAdjustments.forEach((adjustment) => {
      queue.addLedgerAccountBalanceAdjustment({
        correlationId,
        ...ledgerAccountBalanceMapper.toRepoNewBalanceAndAdjustment(adjustment),
      });
    });
  };
}
