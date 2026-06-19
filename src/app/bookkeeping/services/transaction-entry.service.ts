import _ from 'lodash';
import enforceTransactionAccountsRule from '../../../domain/accounting/rules/bookkeeping/transaction.rule';
import journalEntryEntity from '../../../domain/journal-entry/entities/journal-entry.entity';
import journalEntryError from '../../../domain/journal-entry/errors/journal-entry.error';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import ITransactionEntryService from '../contracts/transaction-entry.service.contract';

export default function makeTransactionEntryService(
  ledgerAccountRepo: ILedgerAccountRepo
): ITransactionEntryService {
  return {
    async create(sourceLine, destinationLines, header, repoOptions) {
      const invalidDestinationSides = destinationLines.filter(
        (line) => line.side === sourceLine.side
      );

      if (invalidDestinationSides.length > 0) {
        throw new journalEntryError.InvalidJournalEntry();
      }

      const sourceAccount = await ledgerAccountRepo.findById(
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
      const destinationAccounts = await ledgerAccountRepo.findAllByIds(
        destinationAccountIds,
        repoOptions
      );

      const missingDestinationAccountIds = _.difference(
        destinationAccountIds,
        destinationAccounts.map((account) => account.id)
      );

      if (missingDestinationAccountIds.length > 0) {
        throw new journalEntryError.AccountNotFound({
          cause: { accountIds: missingDestinationAccountIds },
        });
      }

      enforceTransactionAccountsRule(
        sourceAccount,
        destinationAccounts,
        header.sourceType
      );

      return journalEntryEntity.make({
        ...header,
        lines: [sourceLine, ...destinationLines],
      });
    },
  };
}
