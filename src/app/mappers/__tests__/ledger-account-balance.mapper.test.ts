import accountingEntityEntity from '../../../domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '../../../domain/accounting/types/accounting-entity.types';
import ledgerAccountBalanceEntity from '../../../domain/bookkeeping/entities/ledger-account-balance.entity';
import { SYSTEM_CURRENCIES } from '../../../domain/currency/config/currencies.config';
import cashAndEquivalentAccountEntity from '../../../domain/ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import userEntity from '../../../domain/user/entities/user.entity';
import { TEntityId } from '../../../shared/types/uuid';
import moneyValue from '../../../shared/value-objects/money.vo';
import ledgerAccountBalanceMapper, {
  ILedgerAccountBalanceAdjustmentModel,
  ILedgerAccountBalanceModel,
  INewLedgerAccountBalanceAndAdjustmentModel,
} from '../ledger-account-balance.mapper';

describe('Ledger Account Balance Mapper', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const makeBalanceAndAdjustment = () => {
    const [user] = userEntity.make({
      email: 'owner@example.com',
      emailVerified: true,
      firstName: 'Account',
      lastName: 'Owner',
    });
    const [accountingEntity] = accountingEntityEntity.make({
      name: 'Owner Business',
      ownerId: user.id,
      type: EAccountingEntityType.Individual,
      functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
      jurisdictionCode: 'NG',
    });
    const [account] = cashAndEquivalentAccountEntity.makeHeader({
      name: 'Cash',
      accountingEntityId: accountingEntity.id,
      currency: SYSTEM_CURRENCIES.NGN,
      createdBy: user.id,
    });
    const balance = ledgerAccountBalanceEntity.make({
      ledgerAccountId: account.id,
      accountingEntityId: accountingEntity.id,
      accountMaterializedPath: account.materializedPath,
      currencyCode: SYSTEM_CURRENCIES.NGN.code,
      functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
    });
    const adjusted = ledgerAccountBalanceEntity.adjust(balance, {
      ledgerAccountId: account.id,
      amount: moneyValue.make(100_00, SYSTEM_CURRENCIES.NGN, true),
      functionalAmount: moneyValue.make(100_00, SYSTEM_CURRENCIES.NGN, true),
      journalEntryId: '123e4567-e89b-12d3-a456-426614174010' as TEntityId,
      createdBy: user.id,
    });

    return adjusted;
  };

  describe('balance mapping', () => {
    it('maps a balance to a repo model and back', () => {
      const { newBalance } = makeBalanceAndAdjustment();

      const repoModel = ledgerAccountBalanceMapper.toRepo(newBalance);

      expect(repoModel).toEqual({
        ledgerAccountId: newBalance.ledgerAccountId,
        accountingEntityId: newBalance.accountingEntityId,
        accountMaterializedPath: newBalance.accountMaterializedPath,
        amount: 100_00,
        currencyCode: SYSTEM_CURRENCIES.NGN.code,
        functionalAmount: 100_00,
        functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        version: 1,
        createdAt: newBalance.createdAt.toISOString(),
        updatedAt: newBalance.updatedAt.toISOString(),
      });
      expect(ledgerAccountBalanceMapper.fromRepo(repoModel)).toEqual(
        newBalance
      );
    });

    it('maps a balance repo select with currency relations to domain', () => {
      const { newBalance } = makeBalanceAndAdjustment();
      const repoModel = ledgerAccountBalanceMapper.toRepo(newBalance);
      const selectModel: Parameters<
        typeof ledgerAccountBalanceMapper.toDomain
      >[0] = {
        ...repoModel,
        currency: {
          code: SYSTEM_CURRENCIES.NGN.code,
          symbol: SYSTEM_CURRENCIES.NGN.symbol,
          name: SYSTEM_CURRENCIES.NGN.name,
          minorUnit: Number(SYSTEM_CURRENCIES.NGN.minorUnit),
          createdAt: newBalance.createdAt.toISOString(),
          updatedAt: newBalance.updatedAt.toISOString(),
          deletedAt: null,
        },
        functionalCurrency: {
          code: SYSTEM_CURRENCIES.NGN.code,
          symbol: SYSTEM_CURRENCIES.NGN.symbol,
          name: SYSTEM_CURRENCIES.NGN.name,
          minorUnit: Number(SYSTEM_CURRENCIES.NGN.minorUnit),
          createdAt: newBalance.createdAt.toISOString(),
          updatedAt: newBalance.updatedAt.toISOString(),
          deletedAt: null,
        },
      };

      expect(ledgerAccountBalanceMapper.toDomain(selectModel)).toEqual(
        newBalance
      );
    });
  });

  describe('adjustment mapping', () => {
    it('maps an adjustment to a repo model and back', () => {
      const { adjustment } = makeBalanceAndAdjustment();

      const repoModel = ledgerAccountBalanceMapper.toRepoAdjustment(adjustment);

      expect(repoModel).toEqual({
        id: adjustment.id,
        ledgerAccountId: adjustment.ledgerAccountId,
        amount: 100_00,
        currencyCode: SYSTEM_CURRENCIES.NGN.code,
        functionalAmount: 100_00,
        functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        journalEntryId: adjustment.journalEntryId,
        effect: adjustment.effect,
        createdBy: adjustment.createdBy,
        createdAt: adjustment.createdAt.toISOString(),
      });
      expect(ledgerAccountBalanceMapper.fromRepoAdjustment(repoModel)).toEqual(
        adjustment
      );
    });

    it('maps an adjustment to a DTO', () => {
      const { adjustment } = makeBalanceAndAdjustment();

      expect(ledgerAccountBalanceMapper.toAdjustmentDto(adjustment)).toEqual({
        id: adjustment.id,
        ledgerAccountId: adjustment.ledgerAccountId,
        amount: {
          amount: 100_00,
          currencyCode: SYSTEM_CURRENCIES.NGN.code,
          isMinorUnit: true,
        },
        functionalAmount: {
          amount: 100_00,
          currencyCode: SYSTEM_CURRENCIES.NGN.code,
          isMinorUnit: true,
        },
        journalEntryId: adjustment.journalEntryId,
        effect: adjustment.effect,
        createdBy: adjustment.createdBy,
        createdAt: adjustment.createdAt,
      });
    });
  });

  describe('new balance and adjustment mapping', () => {
    it('maps the aggregate repo shape and back', () => {
      const payload = makeBalanceAndAdjustment();
      const repoModel: INewLedgerAccountBalanceAndAdjustmentModel = {
        newBalance: ledgerAccountBalanceMapper.toRepo(
          payload.newBalance
        ) as ILedgerAccountBalanceModel,
        adjustment: ledgerAccountBalanceMapper.toRepoAdjustment(
          payload.adjustment
        ) as ILedgerAccountBalanceAdjustmentModel,
      };

      expect(
        ledgerAccountBalanceMapper.toRepoNewBalanceAndAdjustment(payload)
      ).toEqual(repoModel);
      expect(
        ledgerAccountBalanceMapper.fromRepoNewBalanceAndAdjustment(repoModel)
      ).toEqual(payload);
    });
  });
});
