import { IRepoOptions } from '../../../../../app/contracts/infra/repo.contract';
import { TEntityId } from '../../../../../shared/types/uuid';
import { AppError } from '../../../../../shared/value-objects/error';
import {
  ILedgerAccount,
  ULedgerType,
  ELedgerType,
} from '../../../types/ledger.types';
import mockLedgerAccountRepo from '../../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import { canBootstrapPostingAccount } from '../can-bootstrap-posting-account';

describe('canBootstrapPostingAccount', () => {
  const accountingEntityId =
    '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const repoOptions = {} as IRepoOptions;

  const getLedgerAccount = (
    overrides: Partial<ILedgerAccount> = {}
  ): ILedgerAccount => {
    return {
      type: ELedgerType.Asset,
      isControlAccount: false,
      ...overrides,
    } as ILedgerAccount;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw AppError if control account is not found', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(null);
    mockLedgerAccountRepo.findBySubType.mockResolvedValueOnce([]);

    const params = {
      accountingEntityId,
      type: ELedgerType.Asset as ULedgerType,
      subType: 'cash',
      controlLedgerCode: '100000',
    };

    const expectedError = new AppError('Control account not found', {
      cause: { controlLedgerCode: '100000' },
    });

    await expect(
      canBootstrapPostingAccount(params, mockLedgerAccountRepo, repoOptions)
    ).rejects.toThrow(expectedError);

    expect(mockLedgerAccountRepo.findBySubType).toHaveBeenCalledWith(
      accountingEntityId,
      ELedgerType.Asset,
      'cash',
      repoOptions
    );
    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      '100000',
      accountingEntityId,
      repoOptions
    );
  });

  it('should throw AppError if control account type does not match', async () => {
    const mockControlAccount = getLedgerAccount({
      type: ELedgerType.Liability,
      isControlAccount: true,
    });
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(mockControlAccount);
    mockLedgerAccountRepo.findBySubType.mockResolvedValueOnce([]);

    const params = {
      accountingEntityId,
      type: ELedgerType.Asset as ULedgerType,
      subType: 'cash',
      controlLedgerCode: '100000',
    };

    const expectedError = new AppError('Control account type does not match', {
      cause: { controlLedgerCode: '100000', type: ELedgerType.Asset },
    });

    await expect(
      canBootstrapPostingAccount(params, mockLedgerAccountRepo, repoOptions)
    ).rejects.toThrow(expectedError);
  });

  it('should return canBootstrap: true and controlAccount when no non-control accounts exist', async () => {
    const mockControlAccount = getLedgerAccount({
      type: ELedgerType.Asset,
      isControlAccount: true,
    });

    mockLedgerAccountRepo.findBySubType.mockResolvedValueOnce([
      mockControlAccount,
    ]);
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(mockControlAccount);

    const params = {
      accountingEntityId,
      type: ELedgerType.Asset as ULedgerType,
      subType: 'cash',
      controlLedgerCode: '100000',
    };

    const result = await canBootstrapPostingAccount(
      params,
      mockLedgerAccountRepo,
      repoOptions
    );

    expect(result).toEqual({
      canBootstrap: true,
      controlAccount: mockControlAccount,
    });
  });

  it('should return canBootstrap: false and controlAccount when non-control accounts exist', async () => {
    const mockControlAccount = getLedgerAccount({
      type: ELedgerType.Asset,
      isControlAccount: true,
    });
    const mockExistingAccount = getLedgerAccount({
      type: ELedgerType.Asset,
      isControlAccount: false,
    });

    mockLedgerAccountRepo.findBySubType.mockResolvedValueOnce([
      mockControlAccount,
      mockExistingAccount,
    ]);
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(mockControlAccount);

    const params = {
      accountingEntityId,
      type: ELedgerType.Asset as ULedgerType,
      subType: 'cash',
      controlLedgerCode: '100000',
    };

    const result = await canBootstrapPostingAccount(
      params,
      mockLedgerAccountRepo,
      repoOptions
    );

    expect(result).toEqual({
      canBootstrap: false,
      controlAccount: mockControlAccount,
    });
  });
});
