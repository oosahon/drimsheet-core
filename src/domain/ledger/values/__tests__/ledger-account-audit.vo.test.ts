import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';
import historyError from '@shared/values/history/history.error';

import ledgerAccountEntity from '@domain/ledger/entities/ledger-account.entity';
import ledgerAccountError from '@domain/ledger/errors/ledger-account.error';
import {
  ELedgerAccountAuditAction,
  ULedgerAccountAuditAction,
} from '@domain/ledger/types/ledger-account-audit.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '@domain/ledger/types/ledger.types';
import ledgerAccountAudit from '@domain/ledger/values/ledger-account-audit.vo';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';

describe('ledgerAccountAudit', () => {
  const makeLedgerAccount = () =>
    ledgerAccountEntity.make({
      code: '100000',
      materializedPath: '100000',
      accountingEntityId: generateUUID(),
      type: ELedgerType.Asset,
      normalBalance: ENormalBalance.Debit,
      subType: 'cash',
      behavior: 'cash',
      isControlAccount: false,
      controlAccountId: null,
      name: 'Cash Account',
      currency: SYSTEM_CURRENCIES.USD,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      meta: null,
      createdBy: generateUUID(),
    })[0];

  describe('make', () => {
    it('creates a ledger account audit', () => {
      const account = makeLedgerAccount();

      const audit = ledgerAccountAudit.make({
        before: null,
        after: account,
        action: ELedgerAccountAuditAction.Created,
      });

      expect(audit).toEqual({
        entityId: account.id,
        action: ELedgerAccountAuditAction.Created,
        diff: {
          before: null,
          after: account,
        },
        occurredAt: account.updatedAt,
      });
      expect(Object.isFrozen(audit)).toBe(true);
    });

    it('throws ledgerAccountError.InvalidId if the entity ID is invalid', () => {
      const account = makeLedgerAccount();

      expect(() =>
        ledgerAccountAudit.make({
          before: null,
          after: {
            ...account,
            id: 'invalid-id' as TEntityId,
          },
          action: ELedgerAccountAuditAction.Created,
        })
      ).toThrow(ledgerAccountError.InvalidId);
    });

    it('throws ledgerAccountError.InvalidAction if the action is invalid', () => {
      const account = makeLedgerAccount();

      expect(() =>
        ledgerAccountAudit.make({
          before: null,
          after: account,
          action: 'invalid-action' as ULedgerAccountAuditAction,
        })
      ).toThrow(ledgerAccountError.InvalidAction);
    });

    it('throws ledgerAccountError.InvalidDate if updatedAt is invalid', () => {
      const account = makeLedgerAccount();

      expect(() =>
        ledgerAccountAudit.make({
          before: null,
          after: {
            ...account,
            updatedAt: new Date('invalid-date'),
          },
          action: ELedgerAccountAuditAction.Created,
        })
      ).toThrow(ledgerAccountError.InvalidDate);
    });

    it('throws historyError.InvalidDiff if there are no changes', () => {
      const account = makeLedgerAccount();

      expect(() =>
        ledgerAccountAudit.make({
          before: account,
          after: account,
          action: ELedgerAccountAuditAction.Updated,
        })
      ).toThrow(historyError.InvalidDiff);
    });
  });
});
