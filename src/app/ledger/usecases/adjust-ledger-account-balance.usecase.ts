import ledgerAccountBalanceEntity from '../../../domain/ledger/account-balance/entities/ledger-account-balance.entity';
import ILedgerAccountBalanceRepo from '../../../domain/ledger/account-balance/repos/ledger-account-balance.repo';
import ILedgerAccountRepo from '../../../domain/ledger/shared/repos/ledger-account.repo';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import moneyMapper from '../../money/dtos/money/money.dto.mapper';
import ILedgerBalanceAdjustmentQueue from '../contracts/ledger-balance-adjustment-queue.contract';
import { ILedgerAccountBalanceAdjustmentDto } from '../dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto';
import { ledgerAccountBalanceAdjustmentDtoSchema } from '../dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto.validation';
import ledgerAppError from '../errors/ledger.error';

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo;
  ledgerBalanceAdjustmentQueue: ILedgerBalanceAdjustmentQueue;
}

export default function makeAdjustLedgerAccountBalanceUseCase(
  deps: IDependencies
) {
  return async (payload: ILedgerAccountBalanceAdjustmentDto) => {
    zodValidationRunner(ledgerAccountBalanceAdjustmentDtoSchema, payload);

    const { correlationId, journalEntry, ledgerAccountId, accountingEntityId } =
      payload;

    const balanceDelta = moneyMapper.fromDto(payload.balanceDelta);
    const functionalBalanceDelta = moneyMapper.fromDto(
      payload.functionalBalanceDelta
    );

    const repoOptions = { correlationId };

    const account = await deps.ledgerAccountRepo.findById(
      ledgerAccountId,
      accountingEntityId,
      repoOptions
    );

    if (!account) {
      throw new ledgerAppError.AccountNotFound();
    }

    const existingBalance = await deps.ledgerAccountBalanceRepo.findByAccountId(
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

    await deps.ledgerAccountBalanceRepo.adjustBalance(adjustment, {
      ...repoOptions,
      expectedVersion: existingBalance.version,
    });

    if (account.controlAccountId) {
      const propagateAdjustmentsPayload: ILedgerAccountBalanceAdjustmentDto = {
        ...payload,
        ledgerAccountId: account.controlAccountId,
      };

      await deps.ledgerBalanceAdjustmentQueue.add(propagateAdjustmentsPayload);
    }
  };
}
