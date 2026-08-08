import { TCreationOmits } from '@shared/types/creation-omits.types';
import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';

import ledgerAccountEntity from '@domain/ledger/entities/ledger-account.entity';
import { ELedgerAccountEvent } from '@domain/ledger/events/ledger-account.events';
import { ELedgerAccountAuditAction } from '@domain/ledger/types/ledger-account-audit.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
  ILedgerAccount,
} from '@domain/ledger/types/ledger.types';

describe('Ledger Account Shared Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();
  const validUUID3 = generateUUID();

  const validCurrency: any = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2,
  };

  const validPayload: TCreationOmits<ILedgerAccount, 'openingBalanceDate'> = {
    code: '101001',
    materializedPath: '101001',
    accountingEntityId: validUUID1,
    type: ELedgerType.Asset,
    subType: 'cash',
    behavior: 'bank',
    normalBalance: ledgerAccountEntity.getNormalBalance(ELedgerType.Asset),
    isControlAccount: false,
    controlAccountId: null,
    name: 'Main Bank Account',
    currency: validCurrency,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
    meta: { bankName: 'Test Bank' },
    createdBy: validUUID2,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('Validation Functions', () => {
    it('validateCode: should not throw for valid ledger codes', () => {
      expect(() => ledgerAccountEntity.validateCode('100000')).not.toThrow();
      expect(() => ledgerAccountEntity.validateCode('599999')).not.toThrow();
    });

    it('validateCode: should throw AppError for invalid ledger codes', () => {
      expect(() => ledgerAccountEntity.validateCode('001000')).toThrow();
      expect(() => ledgerAccountEntity.validateCode('600000')).toThrow();
      expect(() => ledgerAccountEntity.validateCode('10100')).toThrow();
      expect(() => ledgerAccountEntity.validateCode('1010011')).toThrow();
      expect(() => ledgerAccountEntity.validateCode('101abc')).toThrow();
    });

    it('validateType: should not throw for valid types', () => {
      expect(() =>
        ledgerAccountEntity.validateType(ELedgerType.Asset)
      ).not.toThrow();
    });

    it('validateType: should throw AppError for invalid type', () => {
      expect(() => {
        // @ts-expect-error testing invalid type
        ledgerAccountEntity.validateType('invalid');
      }).toThrow();
    });

    it('validateStatus: should not throw for valid statuses', () => {
      expect(() =>
        ledgerAccountEntity.validateStatus(ELedgerAccountStatus.Active)
      ).not.toThrow();
    });

    it('validateStatus: should throw AppError for invalid status', () => {
      expect(() => {
        // @ts-expect-error testing invalid status
        ledgerAccountEntity.validateStatus('invalid');
      }).toThrow();
    });

    it('validateContraRule: should not throw for valid contra rules', () => {
      expect(() =>
        ledgerAccountEntity.validateContraRule(
          EContraAccountRule.ContraPermitted
        )
      ).not.toThrow();
    });

    it('validateContraRule: should throw AppError for invalid contra rule', () => {
      expect(() => {
        // @ts-expect-error testing invalid contra rule
        ledgerAccountEntity.validateContraRule('invalid');
      }).toThrow();
    });

    it('validateAdjunctRule: should not throw for valid adjunct rules', () => {
      expect(() =>
        ledgerAccountEntity.validateAdjunctRule(
          EAdjunctAccountRule.AdjunctPermitted
        )
      ).not.toThrow();
    });

    it('validateAdjunctRule: should throw AppError for invalid adjunct rule', () => {
      expect(() => {
        // @ts-expect-error testing invalid adjunct rule
        ledgerAccountEntity.validateAdjunctRule('invalid');
      }).toThrow();
    });

    it('validateMaterializedPath: should not throw for valid lengths', () => {
      expect(() =>
        ledgerAccountEntity.validateMaterializedPath('100000')
      ).not.toThrow();
      expect(() =>
        ledgerAccountEntity.validateMaterializedPath(
          '100000.100001.100002.100003.100004.100005.100006.100007.100008.100009'
        )
      ).not.toThrow(); // 69 characters
    });

    it('validateMaterializedPath: should throw AppError for invalid lengths', () => {
      expect(() =>
        ledgerAccountEntity.validateMaterializedPath('10000')
      ).toThrow(); // 5 chars
      // 70 chars
      expect(() =>
        ledgerAccountEntity.validateMaterializedPath(
          '100000.100001.100002.100003.100004.100005.100006.100007.100008.100009x'
        )
      ).toThrow();
    });
  });

  describe('getSubLedgerCode', () => {
    it('should generate the next sub-ledger code correctly', () => {
      expect(ledgerAccountEntity.getSubLedgerCode('101', '101000')).toBe(
        '101001'
      );
      expect(ledgerAccountEntity.getSubLedgerCode('101', '101009')).toBe(
        '101010'
      );
      expect(ledgerAccountEntity.getSubLedgerCode('300', '300099')).toBe(
        '300100'
      );
    });

    it('should throw if headerCode has invalid format', () => {
      expect(() =>
        ledgerAccountEntity.getSubLedgerCode('10', '100000')
      ).toThrow();
      expect(() =>
        ledgerAccountEntity.getSubLedgerCode('601', '601000')
      ).toThrow();
    });

    it('should throw if predecessorCode does not start with the headerCode or has invalid length', () => {
      expect(() =>
        ledgerAccountEntity.getSubLedgerCode('101', '102000')
      ).toThrow();
      expect(() =>
        ledgerAccountEntity.getSubLedgerCode('101', '10100')
      ).toThrow();
    });

    it('should throw if limit is reached (999)', () => {
      expect(() =>
        ledgerAccountEntity.getSubLedgerCode('101', '101999')
      ).toThrow();
    });
  });

  describe('getMaterializedPath', () => {
    it('returns a correct appended materialized path', () => {
      expect(ledgerAccountEntity.getMaterializedPath('100000', '100001')).toBe(
        '100000.100001'
      );
    });

    it('throws AppError if parent path is too short', () => {
      expect(() =>
        ledgerAccountEntity.getMaterializedPath('10000', '100001')
      ).toThrow();
    });

    it('throws AppError if parent path is too long', () => {
      // 63 characters
      expect(() =>
        ledgerAccountEntity.getMaterializedPath(
          '100000.100001.100002.100003.100004.100005.100006.100007.100008.',
          '100009'
        )
      ).toThrow();
    });
  });

  describe('getNormalBalance', () => {
    it('returns Debit for Asset and Expense', () => {
      expect(ledgerAccountEntity.getNormalBalance(ELedgerType.Asset)).toBe(
        ENormalBalance.Debit
      );
      expect(ledgerAccountEntity.getNormalBalance(ELedgerType.Expense)).toBe(
        ENormalBalance.Debit
      );
    });

    it('returns Credit for Liability, Equity, and Revenue', () => {
      expect(ledgerAccountEntity.getNormalBalance(ELedgerType.Liability)).toBe(
        ENormalBalance.Credit
      );
      expect(ledgerAccountEntity.getNormalBalance(ELedgerType.Equity)).toBe(
        ENormalBalance.Credit
      );
      expect(ledgerAccountEntity.getNormalBalance(ELedgerType.Revenue)).toBe(
        ENormalBalance.Credit
      );
    });

    it('throws AppError for invalid ledger type', () => {
      expect(() => {
        // @ts-expect-error testing invalid type
        ledgerAccountEntity.getNormalBalance('INVALID_TYPE');
      }).toThrow();
    });
  });

  describe('getContraBalance', () => {
    it('returns Credit when normal balance is Debit', () => {
      expect(ledgerAccountEntity.getContraBalance(ENormalBalance.Debit)).toBe(
        ENormalBalance.Credit
      );
    });

    it('returns Debit when normal balance is Credit', () => {
      expect(ledgerAccountEntity.getContraBalance(ENormalBalance.Credit)).toBe(
        ENormalBalance.Debit
      );
    });

    it('throws AppError for invalid normal balance', () => {
      expect(() => {
        // @ts-expect-error testing invalid balance
        ledgerAccountEntity.getContraBalance('INVALID_BALANCE');
      }).toThrow();
    });
  });

  describe('make', () => {
    it('should successfully create a ledger account with valid inputs', () => {
      const [account, events, audit] = ledgerAccountEntity.make(validPayload);

      expect(typeof account.id).toBe('string');
      expect(account.code).toBe('101001');
      expect(account.materializedPath).toBe('101001');
      expect(account.accountingEntityId).toBe(validUUID1);
      expect(account.type).toBe(ELedgerType.Asset);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.isControlAccount).toBe(false);
      expect(account.controlAccountId).toBeNull();
      expect(account.name).toBe('Main Bank Account');
      expect(account.meta).toEqual({ bankName: 'Test Bank' });
      expect(account.createdAt).toEqual(new Date('2026-04-01T00:00:00.000Z'));
      expect(account.updatedAt).toEqual(new Date('2026-04-01T00:00:00.000Z'));
      expect(account.deletedAt).toBeNull();
      expect(Object.isFrozen(account)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(ELedgerAccountEvent.Created);
      expect(events[0].data).toEqual(account);

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

    it('preserves a null currency in the account, event, and audit', () => {
      const [account, events, audit] = ledgerAccountEntity.make({
        ...validPayload,
        currency: null,
      });

      expect(account.currency).toBeNull();
      expect(events[0].data.currency).toBeNull();
      expect(audit.diff.after.currency).toBeNull();
    });

    it('should successfully create a ledger account with a control account ID', () => {
      const payloadWithControl = {
        ...validPayload,
        isControlAccount: true,
        controlAccountId: validUUID3,
      };
      const [account] = ledgerAccountEntity.make(payloadWithControl);
      expect(account.isControlAccount).toBe(true);
      expect(account.controlAccountId).toBe(validUUID3);
    });

    it('should throw if accountingEntityId is invalid UUID', () => {
      const invalidPayload = {
        ...validPayload,
        accountingEntityId: 'invalid' as TEntityId,
      };
      expect(() => ledgerAccountEntity.make(invalidPayload)).toThrow();
    });

    it('should throw if controlAccountId is invalid UUID when provided', () => {
      const invalidPayload = {
        ...validPayload,
        controlAccountId: 'invalid' as TEntityId,
      };
      expect(() => ledgerAccountEntity.make(invalidPayload)).toThrow();
    });

    it('should throw if createdBy is invalid UUID', () => {
      const invalidPayload = {
        ...validPayload,
        createdBy: 'invalid' as TEntityId,
      };
      expect(() => ledgerAccountEntity.make(invalidPayload)).toThrow();
    });

    it('should throw if name is too short', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() => ledgerAccountEntity.make(invalidPayload)).toThrow();
    });

    it('should throw if subType is empty', () => {
      const invalidPayload = { ...validPayload, subType: '' };
      expect(() => ledgerAccountEntity.make(invalidPayload)).toThrow();
    });

    it('should throw if behavior is empty', () => {
      const invalidPayload = { ...validPayload, behavior: '' };
      expect(() => ledgerAccountEntity.make(invalidPayload)).toThrow();
    });

    it('should throw if currency validation fails', () => {
      const invalidPayload = {
        ...validPayload,
        currency: { ...validCurrency, code: 'INVALID' },
      };
      expect(() => ledgerAccountEntity.make(invalidPayload)).toThrow();
    });

    it('should throw if isControlAccount is not a boolean', () => {
      const invalidPayload = {
        ...validPayload,
        isControlAccount: 'yes',
      };
      // @ts-expect-error testing invalid control account flag
      expect(() => ledgerAccountEntity.make(invalidPayload)).toThrow();
    });

    it('should throw if normalBalance is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        normalBalance: 'invalid',
      };
      // @ts-expect-error testing invalid normal balance
      expect(() => ledgerAccountEntity.make(invalidPayload)).toThrow();
    });

    it('should pass if meta is null', () => {
      const payload = { ...validPayload, meta: null };
      const [account] = ledgerAccountEntity.make(payload);
      expect(account.meta).toBeNull();
    });

    it('should throw if meta is invalid (e.g. string)', () => {
      const invalidPayload = {
        ...validPayload,
        meta: 'invalid string',
      };
      // @ts-expect-error testing invalid meta
      expect(() => ledgerAccountEntity.make(invalidPayload)).toThrow();
    });

    it('should throw if materializedPath is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        materializedPath: '12345',
      };
      expect(() => ledgerAccountEntity.make(invalidPayload)).toThrow();
    });

    it('should initialize openingBalanceDate to null by default', () => {
      const [account] = ledgerAccountEntity.make(validPayload);
      expect(account.openingBalanceDate).toBeNull();
    });
  });

  describe('updateOpeningBalanceDate', () => {
    it('should update openingBalanceDate and return updated entity, event, and audit', () => {
      const [account] = ledgerAccountEntity.make(validPayload);
      const openingDate = new Date('2026-01-01');

      const [updatedAccount, events, audit] =
        ledgerAccountEntity.updateOpeningBalanceDate(account, openingDate);

      expect(updatedAccount.openingBalanceDate).toEqual(openingDate);
      expect(updatedAccount.updatedAt.getTime()).toBeGreaterThanOrEqual(
        account.updatedAt.getTime()
      );
      expect(Object.isFrozen(updatedAccount)).toBe(true);
      expect(account.openingBalanceDate).toBeNull(); // immutability

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(ELedgerAccountEvent.Updated);
      expect(events[0].data).toEqual(updatedAccount);

      expect(audit.action).toBe(ELedgerAccountAuditAction.Updated);
      expect(audit.diff.before).toEqual(account);
      expect(audit.diff.after).toEqual(updatedAccount);
    });

    it('should throw when openingBalanceDate is invalid or in the future', () => {
      const [account] = ledgerAccountEntity.make(validPayload);

      expect(() =>
        // @ts-expect-error testing invalid date
        ledgerAccountEntity.updateOpeningBalanceDate(account, null)
      ).toThrow();
      expect(() =>
        ledgerAccountEntity.updateOpeningBalanceDate(
          account,
          new Date('invalid')
        )
      ).toThrow();

      const futureDate = new Date(Date.now() + 86400000 * 10);
      expect(() =>
        ledgerAccountEntity.updateOpeningBalanceDate(account, futureDate)
      ).toThrow();
    });

    it('should throw when account is a control account', () => {
      const controlPayload = { ...validPayload, isControlAccount: true };
      const [controlAccount] = ledgerAccountEntity.make(controlPayload);

      expect(() =>
        ledgerAccountEntity.updateOpeningBalanceDate(
          controlAccount,
          new Date('2026-01-01')
        )
      ).toThrow();
    });

    it('should throw when openingBalanceDate is already set', () => {
      const [account] = ledgerAccountEntity.make(validPayload);
      const openingDate = new Date('2026-01-01');
      const [updatedAccount] = ledgerAccountEntity.updateOpeningBalanceDate(
        account,
        openingDate
      );

      expect(() =>
        ledgerAccountEntity.updateOpeningBalanceDate(
          updatedAccount,
          new Date('2026-02-01')
        )
      ).toThrow();
    });
  });
});
