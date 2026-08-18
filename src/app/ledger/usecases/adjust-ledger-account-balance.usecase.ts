import {
  IRepoService,
  TRepoTransactionFn,
} from '@shared/contracts/repo.contract';
import IReporter from '@shared/contracts/reporter.contract';
import zodValidationRunner from '@shared/utils/zod-validation-runner';

import IJournalEntryRepo from '@domain/journal-entry/repos/journal-entry.repo';
import ILedgerAccountBalanceRepo from '@domain/ledger/repos/ledger-account-balance.repo';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import ILedgerAccountBalanceAdjustmentService from '@domain/ledger/types/ledger-account-balance-adjustment.service.types';

import { ILedgerAccountBalanceAdjustmentDto } from '@app/ledger/dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto';
import { ledgerAccountBalanceAdjustmentDtoSchema } from '@app/ledger/dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto.validation';
import ledgerAppError from '@app/ledger/errors/ledger.error';
import helpers from '@app/ledger/usecases/helpers/adjust-ledger-account-balance.usecase.helpers';
import IOutboxRepo from '@app/outbox/contracts/outbox.repo.contract';
import { EOutboxType } from '@app/outbox/types/outbox.types';

interface IDependencies {
  repoService: IRepoService;
  outboxRepo: IOutboxRepo;
  journalEntryRepo: IJournalEntryRepo;
  ledgerAccountRepo: ILedgerAccountRepo;
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo;
  ledgerAccountBalanceAdjustmentService: ILedgerAccountBalanceAdjustmentService;
  reporter: IReporter;
}

export default function makeAdjustLedgerAccountBalanceUseCase(
  deps: IDependencies
) {
  return async (payload: ILedgerAccountBalanceAdjustmentDto) => {
    zodValidationRunner(ledgerAccountBalanceAdjustmentDtoSchema, payload);

    const { correlationId, journalEntryId } = payload;
    const repoOptions = { correlationId };

    const outbox = await deps.outboxRepo.findByIdAndType(
      journalEntryId,
      EOutboxType.BalancePropagation,
      repoOptions
    );

    if (!outbox) {
      deps.reporter.report(
        'ledger.balance_outbox.missing',
        new ledgerAppError.BalancePropagationOutboxNotFound({
          journalEntryId,
        })
      );

      return;
    }

    const balancePropagation = await helpers.prepareBalancePropagation(
      deps,
      journalEntryId,
      repoOptions
    );

    const balances = await deps.ledgerAccountBalanceRepo.findAllByAccountIds(
      balancePropagation.journalEntry.accountingEntityId,
      balancePropagation.ledgerAccountIds,
      repoOptions
    );

    const preparedAdjustments = helpers.prepareBalanceAdjustments(
      balancePropagation,
      balances
    );

    const transactionFn: TRepoTransactionFn = async (tx) => {
      const writeRepoOptions = { ...repoOptions, tx };

      for (const preparedAdjustment of preparedAdjustments) {
        await deps.ledgerAccountBalanceRepo.adjustBalance(
          preparedAdjustment.balanceAdjustment,
          {
            ...writeRepoOptions,
            expectedVersion: preparedAdjustment.expectedVersion,
          }
        );
      }

      await deps.outboxRepo.delete(journalEntryId, writeRepoOptions);
    };

    await deps.repoService.runInTransaction(transactionFn);
  };
}
