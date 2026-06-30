import generateUUID from '../../../../../shared/utils/uuid-generator';
import { TDirectCostsLedgerCode } from '../../../shared/types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../shared/types/ledger.types';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IDirectCostsAccount,
} from '../../types/expense-account.types';
import directCostsAccountEntity from '../direct-costs.entity';

describe('Direct Costs Expense Entity', () => {
  const validUUID1 = generateUUID();
  const validUUID2 = generateUUID();

  const validCurrency: any = {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    minorUnit: 2n,
  };

  const validParent = {
    precedingCode: '500000' as TDirectCostsLedgerCode,
    parentMaterializedPath: '500000' as TDirectCostsLedgerCode,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('getCode', () => {
    it('should generate the next sub-ledger code for direct costs accounts', () => {
      expect(directCostsAccountEntity.getCode('500000')).toBe('500001');
      expect(directCostsAccountEntity.getCode('500099')).toBe('500100');
    });

    it('should return 500000 if predecessorCode is null', () => {
      expect(directCostsAccountEntity.getCode(null)).toBe('500000');
    });

    it('should throw if predecessor code does not match header code', () => {
      expect(() => directCostsAccountEntity.getCode('501000' as any)).toThrow();
    });
  });

  describe('getMaterializedPath', () => {
    it('should return code if parentMaterializedPath is null', () => {
      expect(directCostsAccountEntity.getMaterializedPath('500000', null)).toBe(
        '500000'
      );
    });

    it('should return concatenated path if parentMaterializedPath is provided', () => {
      expect(
        directCostsAccountEntity.getMaterializedPath('500001', '500000')
      ).toBe('500000.500001');
    });
  });

  describe('make', () => {
    const validPayload: Pick<
      IDirectCostsAccount,
      | 'name'
      | 'createdBy'
      | 'accountingEntityId'
      | 'currency'
      | 'behavior'
      | 'isControlAccount'
      | 'controlAccountId'
      | 'meta'
    > = {
      name: 'Cost of Goods Sold',
      accountingEntityId: validUUID1,

      currency: validCurrency,
      behavior: EExpenseAccountBehavior.COGS,
      createdBy: validUUID2,
      isControlAccount: false,
      controlAccountId: null,
      meta: null,
    };

    it('should successfully create a direct costs account', () => {
      const [account, events] = directCostsAccountEntity.make(
        validPayload,
        validParent
      );

      expect(account.code).toBe('500001');
      expect(account.materializedPath).toBe('500000.500001');
      expect(account.type).toBe(ELedgerType.Expense);
      expect(account.normalBalance).toBe(ENormalBalance.Debit);
      expect(account.subType).toBe(EExpenseSubType.DirectCosts);
      expect(account.behavior).toBe(EExpenseAccountBehavior.COGS);
      expect(account.status).toBe(ELedgerAccountStatus.Active);
      expect(account.isControlAccount).toBe(false);
      expect(account.controlAccountId).toBeNull();
      expect(account.meta).toBeNull();
      expect(account.contraAccountRule).toBe(
        EContraAccountRule.ContraNotPermitted
      );
      expect(account.adjunctAccountRule).toBe(
        EAdjunctAccountRule.AdjunctNotPermitted
      );
      expect(account.createdBy).toBe(validUUID2);
      expect(account.accountingEntityId).toBe(validUUID1);
      expect(events).toHaveLength(2);
    });

    it('should successfully create a direct costs account with controlAccountId', () => {
      const validUUID3 = generateUUID();
      const payloadWithControl = {
        ...validPayload,
        isControlAccount: true,
        controlAccountId: validUUID3,
      };
      const [account, events] = directCostsAccountEntity.make(
        payloadWithControl,
        validParent
      );
      expect(account.isControlAccount).toBe(true);
      expect(account.controlAccountId).toBe(validUUID3);
      expect(events).toHaveLength(2);
    });

    it('should throw if payload values are invalid', () => {
      const invalidPayload = { ...validPayload, name: 'A' };
      expect(() =>
        directCostsAccountEntity.make(invalidPayload, validParent)
      ).toThrow();
    });

    it('should throw if controlAccountId is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        controlAccountId: 'invalid-uuid' as any,
      };
      expect(() =>
        directCostsAccountEntity.make(invalidPayload, validParent)
      ).toThrow();
    });

    it('should use base code 500000 when predecessorCode is null', () => {
      const [account] = directCostsAccountEntity.make(validPayload, null);
      expect(account.code).toBe('500000');
      expect(account.materializedPath).toBe('500000');
    });
  });
});
