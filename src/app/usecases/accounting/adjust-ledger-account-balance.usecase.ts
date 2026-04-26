import ledgerAccountBalanceEntity from '../../../domain/accounting/entities/ledger-account-balance.entity';
import ILedgerAccountBalanceRepo from '../../../domain/accounting/repos/ledger-account-balance.repo';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import stringUtils from '../../../shared/utils/string';
import { AppError } from '../../../shared/value-objects/error';
import { ILedgerAccountBalanceAdjustmentDto } from '../../contracts/dto/workers.dto';
import IQueue from '../../contracts/infra/queues.contract';
import moneyMapper from '../../mappers/money.mapper';

const validate = (payload: ILedgerAccountBalanceAdjustmentDto) => {
  const { correlationId, journalEntry, ledgerAccountId } = payload;

  stringUtils.validateIsNonEmptyString(correlationId, 'Invalid correlation ID');
  stringUtils.validateUUID(journalEntry.id, 'Invalid journal entry ID');
  if (journalEntry.transactionId) {
    stringUtils.validateUUID(
      journalEntry.transactionId,
      'Invalid transaction ID'
    );
  }
  stringUtils.validateUUID(journalEntry.createdBy, 'Invalid created by ID');
  stringUtils.validateUUID(ledgerAccountId, 'Invalid account ID');
};

export default function makeAdjustLedgerAccountBalanceUseCase(
  ledgerAccountRepo: ILedgerAccountRepo,
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo,
  queue: IQueue
) {
  return async (payload: ILedgerAccountBalanceAdjustmentDto) => {
    validate(payload);

    const { correlationId, journalEntry, ledgerAccountId } = payload;

    const balanceDelta = moneyMapper.fromDto(payload.balanceDelta);
    const functionalBalanceDelta = moneyMapper.fromDto(
      payload.functionalBalanceDelta
    );

    const repoOptions = { correlationId };

    const account = await ledgerAccountRepo.findById(
      ledgerAccountId,
      repoOptions
    );

    if (!account) {
      throw new AppError('Account not found', {
        cause: { ledgerAccountId, correlationId },
      });
    }

    const existingBalance =
      await ledgerAccountBalanceRepo.findBalanceByAccountId(
        account.id,
        account.accountingEntityId,
        repoOptions
      );

    if (!existingBalance) {
      throw new AppError('Balance not found for account', {
        cause: { accountId: account.id },
      });
    }

    /**
     * The following assumptions are rightly taken into consideration:
     *  - only header accounts can control sub accounts of different currencies
     *  - header accounts are always in the functional currency.
     */
    const isSameCurrency = balanceDelta.currency.code === account.currency.code;

    const makeAdjustmentPayload = {
      ledgerAccountId: account.id,
      amount: isSameCurrency ? balanceDelta : functionalBalanceDelta,
      functionalAmount: functionalBalanceDelta,
      journalEntryId: journalEntry.id,
      transactionId: journalEntry.transactionId,
      createdBy: journalEntry.createdBy,
    };

    const adjustment = ledgerAccountBalanceEntity.makeAdjustment(
      existingBalance,
      makeAdjustmentPayload
    );

    await ledgerAccountBalanceRepo.adjustBalance(adjustment, {
      ...repoOptions,
      expectedVersion: existingBalance.version,
    });

    if (account.controlAccountId) {
      const propagateAdjustmentsPayload: ILedgerAccountBalanceAdjustmentDto = {
        ...payload,
        ledgerAccountId: account.controlAccountId,
      };

      await queue.addLedgerAccountBalanceAdjustment(
        propagateAdjustmentsPayload
      );
    }
  };
}
