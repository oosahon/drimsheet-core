import cashAndEquivalentAccountEntity from '../../../../../domain/ledger/asset-account/entities/cash-and-equivalents.entity';
import { TCashLedgerCode } from '../../../../../domain/ledger/shared/types/ledger-code.types';
import { SYSTEM_CURRENCIES } from '../../../../../domain/money/config/currencies.config';
import { TEntityId } from '../../../../../shared/types/uuid';
import mapLedgerAccountToDto from '../map-ledger-account-to-dto.helper';

describe('mapLedgerAccountToDto', () => {
  const mockUser = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const mockAccountingEntityId =
    '123e4567-e89b-12d3-a456-426614174002' as TEntityId;

  const [mockAccount] = cashAndEquivalentAccountEntity.makePettyCashAccount(
    {
      name: 'Petty Cash',
      currency: SYSTEM_CURRENCIES.NGN,
      isControlAccount: false,
      createdBy: mockUser,
      controlAccountId: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
      accountingEntityId: mockAccountingEntityId,
    },
    {
      precedingCode: '100000' as TCashLedgerCode,
      parentMaterializedPath: '100000' as TCashLedgerCode,
    }
  );

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
