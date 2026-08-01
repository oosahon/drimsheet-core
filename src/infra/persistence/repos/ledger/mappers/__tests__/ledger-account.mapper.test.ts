import { ILedgerAccount } from '../../../../../../domain/ledger/shared/types/ledger.types';
import { TEntityId } from '../../../../../../shared/types/uuid';
import ledgerAccountMapper, {
  ILedgerAccountModel,
} from '../ledger-account.mapper';

describe('Ledger Account Mapper', () => {
  const createdAt = new Date('2026-04-10T12:00:00Z');
  const updatedAt = new Date('2026-04-10T12:30:00Z');

  const domainLedgerAccount: ILedgerAccount = {
    id: 'account-1' as TEntityId,
    code: '1000',
    materializedPath: '1000',
    accountingEntityId: 'entity-1' as TEntityId,

    type: 'asset',
    normalBalance: 'debit',
    subType: 'CASH_AND_CASH_EQUIVALENTS',
    behavior: 'POSTING',
    isControlAccount: false,
    controlAccountId: null,
    name: 'Cash',
    currency: {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      minorUnit: 2,
    },
    status: 'active',
    contraAccountRule: 'contra_not_applicable',
    adjunctAccountRule: 'adjunct_not_applicable',
    meta: { description: 'Main cash account' },
    openingBalanceDate: null,
    createdBy: 'user-1' as TEntityId,
    createdAt,
    updatedAt,
    deletedAt: null,
  };

  const repoModel: ILedgerAccountModel = {
    id: 'account-1',
    code: '1000',
    materializedPath: '1000',
    accountingEntityId: 'entity-1',

    type: 'asset',
    normalBalance: 'debit',
    subType: 'CASH_AND_CASH_EQUIVALENTS',
    behavior: 'POSTING',
    isControlAccount: false,
    controlAccountId: null,
    name: 'Cash',
    currencyCode: 'USD',
    status: 'active',
    contraAccountRule: 'contra_not_applicable',
    adjunctAccountRule: 'adjunct_not_applicable',
    meta: { description: 'Main cash account' },
    openingBalanceDate: null,
    createdBy: 'user-1',
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    deletedAt: null,
  };

  const currencyRepoModel = {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    minorUnit: 2,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    deletedAt: null,
  };

  describe('toRepo', () => {
    it('should map a domain ledger account to a repo model', () => {
      expect(ledgerAccountMapper.toRepo(domainLedgerAccount)).toEqual(
        repoModel
      );
    });
    it('should map a domain ledger account with openingBalanceDate to a repo model', () => {
      const openingDate = new Date('2026-01-01T00:00:00.000Z');
      const domainWithDate = {
        ...domainLedgerAccount,
        openingBalanceDate: openingDate,
      };
      const mapped = ledgerAccountMapper.toRepo(domainWithDate);
      expect(mapped.openingBalanceDate).toBe('2026-01-01');
    });
  });

  describe('toDomain', () => {
    it('should map a repo model to a domain ledger account', () => {
      const payload: Parameters<typeof ledgerAccountMapper.toDomain>[0] = {
        ...repoModel,
        currency: currencyRepoModel,
      };
      expect(ledgerAccountMapper.toDomain(payload)).toEqual(
        domainLedgerAccount
      );
    });

    it('should map a repo model with openingBalanceDate to a domain ledger account', () => {
      const payload: Parameters<typeof ledgerAccountMapper.toDomain>[0] = {
        ...repoModel,
        openingBalanceDate: '2026-01-01',
        currency: currencyRepoModel,
      };
      const domain = ledgerAccountMapper.toDomain(payload);
      expect(domain.openingBalanceDate).toEqual(new Date('2026-01-01'));
    });
  });
});
