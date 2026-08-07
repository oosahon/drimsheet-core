import { IAccountingEntity } from '../../../../../domain/accounting/types/accounting-entity.types';
import makeCashAccountService from '../../../../../domain/ledger/services/asset-account/cash-account.service';
import { ILedgerAccount } from '../../../../../domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '../../../../../domain/money/config/currencies.config';
import { TEntityId } from '../../../../../shared/types/uuid';
import { mockLedgerAccountRepo } from '../../../contracts/__mocks__/ledger.repos.mock';
import mapLedgerAccountToDto from '../map-ledger-account-to-dto.helper';

describe('mapLedgerAccountToDto', () => {
  const mockUser = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const accountingEntity = {
    id: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
    ownerId: mockUser,
    functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
  } as IAccountingEntity;
  const cashAccountService = makeCashAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  let mockAccount: ILedgerAccount;

  beforeAll(async () => {
    const [controlAccount] = await cashAccountService.createHeader(
      {
        name: 'Cash',
        accountingEntity,
        userId: mockUser,
      },
      { correlationId: 'test-correlation-id' }
    );
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(controlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);
    [mockAccount] = await cashAccountService.createPettyCashSubAccount(
      {
        name: 'Petty Cash',
        currency: SYSTEM_CURRENCIES.NGN,
        isControlAccount: false,
        userId: mockUser,
        accountingEntity,
      },
      { correlationId: 'test-correlation-id' }
    );
  });

  it('returns DTO with zero balances when journalEntry is null', () => {
    const dto = mapLedgerAccountToDto(mockAccount, null, 'NGN');
    expect(dto.id).toBe(mockAccount.id);
    expect(dto.balance).toEqual({
      amount: 0,
      currencyCode: 'NGN',
      isMinorUnit: true,
    });
    expect(dto.functionalBalance).toEqual({
      amount: 0,
      currencyCode: 'NGN',
      isMinorUnit: true,
    });
  });
});
