import lodash from 'lodash';
import getTransactionRule from '../../../domain/accounting/rules/bookkeeping/transaction.rule';
import journalEntryEntity from '../../../domain/journal-entry/entities/journal-entry.entity';
import journalEntryError from '../../../domain/journal-entry/errors/journal-entry.error';
import { EJournalEntryStatus } from '../../../domain/journal-entry/types/journal-entry.types';
import { IJournalLineMakePayload } from '../../../domain/journal-entry/types/journal-line.types';
import ILedgerAccountRepo from '../../../domain/ledger/shared/repos/ledger-account.repo';
import ITransactionEntryService from '../contracts/transaction-entry.service.contract';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}

export default function makeTransactionEntryService(
  deps: IDependencies
): ITransactionEntryService {
  return {
    async create(sourceLine, destinationLines, header, repoOptions) {
      const sourceAccount = await deps.ledgerAccountRepo.findById(
        sourceLine.accountId,
        repoOptions
      );

      if (!sourceAccount) {
        throw new journalEntryError.AccountNotFound({
          cause: { accountId: sourceLine.accountId },
        });
      }

      if (sourceAccount.isControlAccount) {
        throw new journalEntryError.ControlAccountTransactionNotAllowed({
          accountId: sourceLine.accountId,
        });
      }

      const destinationAccountIds = destinationLines.map(
        (line) => line.accountId
      );
      const destinationAccounts = await deps.ledgerAccountRepo.findAllByIds(
        destinationAccountIds,
        repoOptions
      );

      const destinationControlAccounts = destinationAccounts.filter(
        (v) => v.isControlAccount
      );

      if (destinationControlAccounts.length > 0) {
        throw new journalEntryError.ControlAccountTransactionNotAllowed({
          accountId: destinationControlAccounts.map((v) => v.id),
        });
      }

      const missingDestinationAccountIds = lodash.difference(
        destinationAccountIds,
        destinationAccounts.map((account) => account.id)
      );

      if (missingDestinationAccountIds.length > 0) {
        throw new journalEntryError.AccountNotFound({
          cause: { accountIds: missingDestinationAccountIds },
        });
      }

      if (header.status !== EJournalEntryStatus.Draft) {
        const allAccounts = [sourceAccount, ...destinationAccounts];
        const offendingAccounts = allAccounts.filter(
          (account) =>
            account.openingBalanceDate !== null &&
            header.effectiveDate.getTime() <
              account.openingBalanceDate.getTime()
        );

        if (offendingAccounts.length > 0) {
          throw new journalEntryError.EntryPredatesAccountOpeningBalance({
            cause: {
              effectiveDate: header.effectiveDate,
              offendingAccounts: offendingAccounts.map((account) => ({
                accountId: account.id,
                openingBalanceDate: account.openingBalanceDate,
              })),
            },
          });
        }
      }

      const rule = getTransactionRule(header.sourceType);
      rule.enforce(sourceAccount, destinationAccounts);

      const sides = rule.getSides();

      const sourceLineWithSide: IJournalLineMakePayload = {
        ...sourceLine,
        side: sides.source,
      };

      const destinationLinesWithSides: IJournalLineMakePayload[] =
        destinationLines.map((line) => ({
          ...line,
          side: sides.destination,
        }));

      return journalEntryEntity.make({
        ...header,
        lines: [sourceLineWithSide, ...destinationLinesWithSides],
      });
    },
  };
}
