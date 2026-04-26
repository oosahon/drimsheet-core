import { SYSTEM_CURRENCIES } from '../../../../domain/currency/config/currencies.config';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
  ILedgerAccount,
} from '../../../../domain/ledger/types/ledger.types';
import mockLogger from '../../../../infra/observability/__mocks__/logger.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import makeMapCategoryToAccountUseCase from '../map-category-to-account.usecase';

describe('mapCategoryToAccountUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validEntityId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const validOwnerId = '223e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const validLedgerAccountId =
    '323e4567-e89b-12d3-a456-426614174000' as TEntityId;

  const getBaseAccount = (overrides = {}): ILedgerAccount => ({
    id: validLedgerAccountId,
    code: '100000',
    materializedPath: '100000',
    accountingEntityId: validEntityId,
    type: ELedgerType.Expense,
    normalBalance: ENormalBalance.Debit,
    subType: 'operating_expense',
    behavior: 'operating_expense',
    isControlAccount: false,
    controlAccountId: null,
    name: 'Operating Expense',
    currency: SYSTEM_CURRENCIES.NGN,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.NotApplicable,
    adjunctAccountRule: EAdjunctAccountRule.NotApplicable,
    meta: null,
    createdBy: validOwnerId,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  });

  const usecase = makeMapCategoryToAccountUseCase(mockLogger);

  it('should skip category mapping if account is a control account', async () => {
    const account = getBaseAccount({ isControlAccount: true });

    await usecase(account);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      `Skipping category mapping for control account ${account.id} with type ${account.type}`
    );
  });

  it('should skip category mapping if account type is not mappable', async () => {
    const account = getBaseAccount({ type: ELedgerType.Asset });

    await usecase(account);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      `Skipping category mapping for account ${account.id} with type ${account.type}`
    );
  });

  it.each([ELedgerType.Expense, ELedgerType.Liability, ELedgerType.Revenue])(
    'should create category if account type is %s and not a control account',
    async (type) => {
      const account = getBaseAccount({ type });

      await usecase(account);

      expect(mockLogger.warn).not.toHaveBeenCalled();
    }
  );
});
