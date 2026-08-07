import {
  ERepoLock,
  IReadRepoOptions,
} from '../../../../../../shared/types/repo.types';
import { TEntityId } from '../../../../../../shared/types/uuid';
import { ASSET_LEDGER_CODES } from '../../../../config/asset-codes.config';
import ledgerAccountError from '../../../../errors/ledger-account.error';
import ILedgerAccountRepo from '../../../../repos/ledger-account.repo';
import { EAssetSubType } from '../../../../types/asset-account.types';
import { TCashLedgerCode } from '../../../../types/ledger-code.types';
import { ELedgerType, ILedgerAccount } from '../../../../types/ledger.types';
import resolveCashSubAccountScope from '../cash-sub-account-scope.helper';

const mockLedgerAccountRepo: jest.Mocked<ILedgerAccountRepo> = {
  create: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
  findAllByIds: jest.fn(),
  findByCode: jest.fn(),
  findBySubType: jest.fn(),
  findByBehavior: jest.fn(),
  findLatestBySubType: jest.fn(),
  findAll: jest.fn(),
};

describe('resolveCashSubAccountScope', () => {
  const accountingEntityId =
    '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const controlAccountId = '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
  const repoOptions: IReadRepoOptions = {
    correlationId: 'test-corr',
    lock: ERepoLock.Share,
  };

  const validControlAccount = {
    id: controlAccountId,
    code: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
    materializedPath: '100000',
    type: ELedgerType.Asset,
    subType: EAssetSubType.CashAndCashEquivalent,
    isControlAccount: true,
  } as ILedgerAccount;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves scope using default header control account and latest sub-account code', async () => {
    const latestAccount = { code: '100002' } as ILedgerAccount;
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(validControlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(
      latestAccount
    );

    const result = await resolveCashSubAccountScope(
      mockLedgerAccountRepo,
      accountingEntityId,
      undefined,
      repoOptions
    );

    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
      accountingEntityId,
      repoOptions
    );
    expect(mockLedgerAccountRepo.findLatestBySubType).toHaveBeenCalledWith(
      accountingEntityId,
      ELedgerType.Asset,
      EAssetSubType.CashAndCashEquivalent,
      repoOptions
    );
    expect(result.controlAccount).toBe(validControlAccount);
    expect(result.factoryContext).toEqual({
      precedingCode: '100002',
      parentMaterializedPath: '100000',
    });
  });

  it('resolves scope using custom control account code and falls back to control account code when no sub-account exists', async () => {
    const customCode = '100010' as TCashLedgerCode;
    const customControlAccount = {
      ...validControlAccount,
      code: customCode,
      materializedPath: '100010',
    } as ILedgerAccount;

    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(
      customControlAccount
    );
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);

    const result = await resolveCashSubAccountScope(
      mockLedgerAccountRepo,
      accountingEntityId,
      customCode,
      repoOptions
    );

    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      customCode,
      accountingEntityId,
      repoOptions
    );
    expect(result.factoryContext).toEqual({
      precedingCode: customCode,
      parentMaterializedPath: customCode,
    });
  });

  it('throws ControlAccountNotFound when control account is missing', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(null);

    await expect(
      resolveCashSubAccountScope(
        mockLedgerAccountRepo,
        accountingEntityId,
        undefined,
        repoOptions
      )
    ).rejects.toBeInstanceOf(ledgerAccountError.ControlAccountNotFound);
  });

  it('throws InvalidControlAccount when found account is not a valid control account', async () => {
    const invalidAccount = {
      ...validControlAccount,
      isControlAccount: false,
    } as ILedgerAccount;

    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(invalidAccount);

    await expect(
      resolveCashSubAccountScope(
        mockLedgerAccountRepo,
        accountingEntityId,
        undefined,
        repoOptions
      )
    ).rejects.toBeInstanceOf(ledgerAccountError.InvalidControlAccount);
  });
});
