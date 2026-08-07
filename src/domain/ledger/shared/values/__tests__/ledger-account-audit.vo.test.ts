import { TEntityId } from '../../../../../shared/types/uuid';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import historyError from '../../../../../shared/values/history/history.error';
import { SYSTEM_CURRENCIES } from '../../../../money/config/currencies.config';
import {
  ELedgerAccountAuditAction,
  ULedgerAccountAuditAction,
} from '../../../types/ledger-account-audit.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../types/ledger.types';
import ledgerAccountEntity from '../../entities/ledger-account.entity';
import ledgerError from '../../errors/ledger.error';
import ledgerAccountAudit from '../ledger-account-audit.vo';

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

    it('throws ledgerError.InvalidId if the entity ID is invalid', () => {
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
      ).toThrow(ledgerError.InvalidId);
    });

    it('throws ledgerError.InvalidAction if the action is invalid', () => {
      const account = makeLedgerAccount();

      expect(() =>
        ledgerAccountAudit.make({
          before: null,
          after: account,
          action: 'invalid-action' as ULedgerAccountAuditAction,
        })
      ).toThrow(ledgerError.InvalidAction);
    });

    it('throws ledgerError.InvalidDate if updatedAt is invalid', () => {
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
      ).toThrow(ledgerError.InvalidDate);
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
