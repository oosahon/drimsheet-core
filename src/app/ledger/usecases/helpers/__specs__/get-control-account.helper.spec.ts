import generateUUID from '@shared/utils/uuid-generator';

import accountingEntityEntity from '@domain/accounting/entities/accounting-entity.entity';
import { EAccountingEntityType } from '@domain/accounting/types/accounting-entity.types';
import { ASSET_LEDGER_CODES } from '@domain/ledger/config/asset-codes.config';
import ledgerAccountError from '@domain/ledger/errors/ledger-account.error';
import makeCashAccountService from '@domain/ledger/services/asset-account/cash-account.service';
import { TCashLedgerCode } from '@domain/ledger/types/ledger-code.types';

import { mockLedgerAccountRepo } from '@app/ledger/contracts/__mocks__/ledger.repos.mock';
import ledgerAppError from '@app/ledger/errors/ledger.error';
import getControlAccountHelper from '@app/ledger/usecases/helpers/get-control-account.helper';

describe('getControlAccountHelper', () => {
  const correlationId = 'test-correlation-id';
  const createdBy = generateUUID();
  const [accountingEntity] = accountingEntityEntity.make({
    name: 'Test Accounting Entity',
    ownerId: createdBy,
    type: EAccountingEntityType.Individual,
    functionalCurrencyCode: 'NGN',
    jurisdictionCode: 'NG',
  });
  const cashAccountService = makeCashAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  const defaultControlAccountCode =
    ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER;
  const basePayload = {
    defaultControlAccountCode,
    accountingEntityId: accountingEntity.id,
    repoOptions: { correlationId },
  };

  type TCashAccountResult = Awaited<
    ReturnType<typeof cashAccountService.createHeader>
  >;
  let defaultControlAccount: TCashAccountResult[0];

  beforeAll(async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(null);
    [defaultControlAccount] = await cashAccountService.createHeader(
      {
        name: 'Cash and Cash Equivalents',
        userId: createdBy,
        accountingEntity,
      },
      { correlationId }
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves an explicit control account ID and preserves the code type', async () => {
    const selectedControlAccount = {
      ...defaultControlAccount,
      id: generateUUID(),
      code: '100500' as TCashLedgerCode,
    };
    mockLedgerAccountRepo.findById.mockResolvedValueOnce(
      selectedControlAccount
    );

    const controlAccount = await getControlAccountHelper<TCashLedgerCode>({
      ledgerAccountRepo: mockLedgerAccountRepo,
      ...basePayload,
      controlAccountId: selectedControlAccount.id,
    });
    const resolvedCode: TCashLedgerCode = controlAccount.code;

    expect(controlAccount).toBe(selectedControlAccount);
    expect(resolvedCode).toBe(selectedControlAccount.code);
    expect(mockLedgerAccountRepo.findById).toHaveBeenCalledWith(
      selectedControlAccount.id,
      accountingEntity.id,
      { correlationId }
    );
    expect(mockLedgerAccountRepo.findByCode).not.toHaveBeenCalled();
  });

  it('resolves the default control account by code', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(
      defaultControlAccount
    );

    await expect(
      getControlAccountHelper<TCashLedgerCode>({
        ledgerAccountRepo: mockLedgerAccountRepo,
        ...basePayload,
      })
    ).resolves.toBe(defaultControlAccount);

    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      defaultControlAccountCode,
      accountingEntity.id,
      { correlationId }
    );
    expect(mockLedgerAccountRepo.findById).not.toHaveBeenCalled();
  });

  it('rejects a missing explicit control account with the requested ID', async () => {
    const controlAccountId = generateUUID();
    mockLedgerAccountRepo.findById.mockResolvedValueOnce(null);

    await expect(
      getControlAccountHelper<TCashLedgerCode>({
        ledgerAccountRepo: mockLedgerAccountRepo,
        ...basePayload,
        controlAccountId,
      })
    ).rejects.toMatchObject({
      errorKey: new ledgerAppError.AccountNotFound().errorKey,
      cause: { id: controlAccountId },
    });

    expect(mockLedgerAccountRepo.findByCode).not.toHaveBeenCalled();
  });

  it('rejects a missing default control account with the requested code', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(null);

    await expect(
      getControlAccountHelper<TCashLedgerCode>({
        ledgerAccountRepo: mockLedgerAccountRepo,
        ...basePayload,
      })
    ).rejects.toMatchObject({
      errorKey: new ledgerAccountError.ControlAccountNotFound().errorKey,
      cause: { controlAccountLedgerCode: defaultControlAccountCode },
    });

    expect(mockLedgerAccountRepo.findById).not.toHaveBeenCalled();
  });
});
