import { IRepoOptions } from '../../../../app/contracts/infra/repo.contract';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../accounting-entity/types/accounting-entity.types';
import { ICurrency } from '../../../currency/types/currency.types';
import { IStatutoryReceivableAccount } from '../../types/asset-account.types';
import { ELedgerType, ILedgerAccount } from '../../types/ledger.types';
import { IStatutoryPayableAccount } from '../../types/liability-account.types';
import ledgerService from '../ledger-bootstrap.service';

describe('ledgerService', () => {
  const service = ledgerService(mockLedgerAccountRepo);
  const repoOptions: IRepoOptions = { correlationId: 'test-req' };
  const accountingEntityId =
    '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const ownerId = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;

  const accountingEntity = {
    id: accountingEntityId,
    ownerId,
    type: EAccountingEntityType.Individual,
    functionalCurrency: { code: 'USD' } as unknown as ICurrency,
  } as unknown as IAccountingEntity;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('bootstrapIndividualHeaderAccounts', () => {
    it('should create all expected accounts across all services', async () => {
      mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

      const result = await service.bootstrapIndividualHeaderAccounts(
        accountingEntity,
        repoOptions
      );

      // Asset(4) + Liability(4) + Equity(2) + Revenue(4) + Expense(6) = 20
      expect(result.length).toBe(20);
    });

    it('should throw AppError if entity is not individual', async () => {
      const companyEntity = {
        ...accountingEntity,
        type: EAccountingEntityType.Company,
      } as unknown as IAccountingEntity;

      await expect(
        service.bootstrapIndividualHeaderAccounts(companyEntity, repoOptions)
      ).rejects.toThrow(AppError);
    });
  });

  describe('bootstrapPostingAccounts', () => {
    const mockStatutoryReceivable = {
      id: '123e4567-e89b-12d3-a456-426614174005' as TEntityId,
      code: '102002',
    } as unknown as IStatutoryReceivableAccount;

    const mockStatutoryPayable = {
      id: '123e4567-e89b-12d3-a456-426614174006' as TEntityId,
      code: '201002',
    } as unknown as IStatutoryPayableAccount;

    const mockControlAccount = {
      id: '123e4567-e89b-12d3-a456-426614174007' as TEntityId,
      type: ELedgerType.Expense,
      isControlAccount: true,
    } as unknown as ILedgerAccount;

    it('should create all expected bootstrap accounts across all services', async () => {
      mockLedgerAccountRepo.findBySubType.mockImplementation(
        async (entityId, type) => {
          if (type === ELedgerType.Asset || type === ELedgerType.Liability) {
            return [];
          }
          return [
            { ...mockControlAccount, type },
          ] as unknown as ILedgerAccount[];
        }
      );

      mockLedgerAccountRepo.findByBehavior.mockImplementation(
        async (entityId, behavior) => {
          if (behavior.includes('receivable'))
            return [mockStatutoryReceivable] as unknown as ILedgerAccount[];
          if (behavior.includes('payable'))
            return [mockStatutoryPayable] as unknown as ILedgerAccount[];
          return [] as unknown as ILedgerAccount[];
        }
      );

      mockLedgerAccountRepo.findByCode.mockImplementation(async (code) => {
        let type: string = ELedgerType.Revenue;
        if (code.startsWith('5')) type = ELedgerType.Expense;
        return { ...mockControlAccount, type } as unknown as ILedgerAccount;
      });

      const result = await service.bootstrapPostingAccounts(
        accountingEntity,
        repoOptions
      );

      // Asset(2) + Liability(2) + Revenue(4) + Expense(6) = 14
      expect(result.length).toBe(14);
    });

    it('should throw AppError if entity is not individual', async () => {
      const companyEntity = {
        ...accountingEntity,
        type: EAccountingEntityType.Company,
      } as unknown as IAccountingEntity;

      await expect(
        service.bootstrapPostingAccounts(companyEntity, repoOptions)
      ).rejects.toThrow(AppError);
    });
  });
});
