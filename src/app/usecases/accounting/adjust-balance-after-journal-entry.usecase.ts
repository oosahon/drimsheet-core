import ledgerAccountBalanceEntity from '../../../domain/accounting/entities/ledger-account-balance.entity';
import ILedgerAccountBalanceRepo from '../../../domain/accounting/repos/ledger-account-balance.repo';
import makeAccountingService from '../../../domain/accounting/services/accounting.service';
import {
  EJournalEntryStatus,
  IJournalEntry,
} from '../../../domain/journal-entry/types/journal-entry.types';
import { IJournalLine } from '../../../domain/journal-entry/types/journal-line.types';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { TEntityId } from '../../../shared/types/uuid';
import { ErrorResourceNotFound } from '../../../shared/value-objects/error';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import IEventBus from '../../contracts/infra/event-bus.contract';

export default function makeAdjustBalanceAfterJournalEntryUseCase(
  requestContext: IRequestContext,
  ledgerAccountRepo: ILedgerAccountRepo,
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo,
  eventBus: IEventBus
) {
  const accountingService = makeAccountingService(ledgerAccountRepo);

  return async (journalEntry: IJournalEntry) => {
    if (journalEntry.status === EJournalEntryStatus.Draft) return;

    const { correlationId, accountingEntity, user } = requestContext.get();

    const accountMap = new Map<TEntityId, IJournalLine[]>();

    journalEntry.lines.forEach((line) => {
      const accountLines = accountMap.get(line.accountId);

      if (accountLines) {
        accountLines.push(line);
      } else {
        accountMap.set(line.accountId, [line]);
      }
    });

    const repoOptions = { correlationId };
    for (const [accountId, lines] of accountMap.entries()) {
      const balance = await ledgerAccountBalanceRepo.findBalanceByAccountId(
        accountId,
        accountingEntity.id,
        repoOptions
      );

      if (!balance) {
        throw new ErrorResourceNotFound('Balance not found for account', {
          correlationId,
          accountId,
          accountingEntityId: accountingEntity.id,
        });
      }

      const { balanceDelta, functionalBalanceDelta } =
        await accountingService.getBalanceEffectDelta(
          accountId,
          lines,
          repoOptions
        );

      const makeAdjustmentPayload = {
        ledgerAccountId: accountId,
        amount: balanceDelta,
        functionalAmount: functionalBalanceDelta,
        journalEntryId: journalEntry.id,
        transactionId: journalEntry.transactionId,
        createdBy: user.id,
      };

      const [newBalanceAndAdjustment, adjustmentEvents] =
        ledgerAccountBalanceEntity.makeAdjustment(
          balance,
          makeAdjustmentPayload
        );

      await ledgerAccountBalanceRepo.adjustBalance(
        newBalanceAndAdjustment,
        repoOptions
      );

      eventBus.publish(
        eventValue.enrichAll(adjustmentEvents, { correlationId })
      );
    }
  };
}
