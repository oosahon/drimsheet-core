import ledgerAccountBalanceEntity from '../../../domain/bookkeeping/entities/ledger-account-balance.entity';
import ILedgerAccountBalanceRepo from '../../../domain/bookkeeping/repos/ledger-account-balance.repo';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import ledgerAppError from '../../ledger/errors/ledger.error';
import IQueue from '../../shared/contracts/queues.contract';
import {
  ILedgerAccountBalanceAdjustmentDto,
  ledgerAccountBalanceAdjustmentDtoSchema,
} from '../../shared/dtos/workers.dto';
import moneyMapper from '../../shared/mappers/money.mapper';

export default function makeAdjustLedgerAccountBalanceUseCase(
  ledgerAccountRepo: ILedgerAccountRepo,
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo,
  queue: IQueue
) {
  return async (payload: ILedgerAccountBalanceAdjustmentDto) => {
    zodValidationRunner(ledgerAccountBalanceAdjustmentDtoSchema, payload);

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
      throw new ledgerAppError.AccountNotFound();
    }

    const existingBalance = await ledgerAccountBalanceRepo.findByAccountId(
      account.id,
      account.accountingEntityId,
      repoOptions
    );

    if (!existingBalance) {
      throw new ledgerAppError.BalanceNotFound();
    }

    /**
     * The following assumptions are rightly taken into consideration:
     *  - only header accounts can control sub accounts of different currencies
     *  - header accounts are always in the functional currency.
     */
    const isSameCurrency = balanceDelta.currency.code === account.currency.code;

    const adjustPayload = {
      ledgerAccountId: account.id,
      amount: isSameCurrency ? balanceDelta : functionalBalanceDelta,
      functionalAmount: functionalBalanceDelta,
      journalEntryId: journalEntry.id,
      createdBy: journalEntry.createdBy,
    };

    const adjustment = ledgerAccountBalanceEntity.adjust(
      existingBalance,
      adjustPayload
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
