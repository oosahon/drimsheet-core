import { IRepoOptions } from '../../../../app/contracts/infra/repo.contract';
import { mockAccountingEntityRepo } from '../../../../infra/persistence/repos/__mocks__/accounting-entity.repo.impl.mock';
import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { ErrorConflict } from '../../../../shared/value-objects/error';
import { EAccountingEntityEvents } from '../../events/accounting-entity.events';
import {
  EAccountingEntityType,
  IAccountingEntity,
  UAccountingEntityType,
} from '../../types/accounting-entity.types';
import accountingEntityService from '../accounting-entity.service';

describe('accountingEntityService', () => {
  const service = accountingEntityService(mockAccountingEntityRepo);
  const userId = generateUUID();
  const mockOptions: IRepoOptions = { correlationId: 'test-correlation-id' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('make', () => {
    const validBasePayload: Omit<
      TCreationOmits<IAccountingEntity>,
      'type' | 'name'
    > = {
      operatingCountryCode: 'NG',
      ownerId: generateUUID(),
      functionalCurrency: {
        code: 'NGN',
        minorUnit: 2n,
        name: 'Naira',
        symbol: '₦',
      },
      reportingCurrency: {
        code: 'USD',
        minorUnit: 2n,
        name: 'Dollar',
        symbol: '$',
      },
      fiscalYearStart: { month: 1, day: 1 },
    };

    const generateValidEntity = (
      type: UAccountingEntityType
    ): IAccountingEntity => {
      return {
        id: generateUUID(),
        name: 'Existing Entity',
        operatingCountryCode: 'NG',
        type,
        ownerId: generateUUID(),
        functionalCurrency: {
          code: 'NGN',
          minorUnit: 2n,
          name: 'Naira',
          symbol: '₦',
        },
        reportingCurrency: {
          code: 'USD',
          minorUnit: 2n,
          name: 'Dollar',
          symbol: '$',
        },
        fiscalYearStart: { month: 1, day: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };
    };

    it('should throw ErrorConflict if user already has an individual entity and tries to create another', async () => {
      const existingEntity = generateValidEntity(
        EAccountingEntityType.Individual
      );
      mockAccountingEntityRepo.findByUserId.mockResolvedValueOnce([
        existingEntity,
      ]);

      const payload: TCreationOmits<IAccountingEntity> = {
        ...validBasePayload,
        name: 'John Doe',
        type: EAccountingEntityType.Individual,
      };

      await expect(service.make(userId, payload, mockOptions)).rejects.toThrow(
        ErrorConflict
      );
      expect(mockAccountingEntityRepo.findByUserId).toHaveBeenCalledWith(
        userId,
        mockOptions,
        EAccountingEntityType.Individual
      );
    });

    it('should create an individual entity if none exists', async () => {
      mockAccountingEntityRepo.findByUserId.mockResolvedValueOnce([]);

      const payload: TCreationOmits<IAccountingEntity> = {
        ...validBasePayload,
        name: 'John Doe',
        type: EAccountingEntityType.Individual,
      };

      const result = await service.make(userId, payload, mockOptions);

      expect(mockAccountingEntityRepo.findByUserId).toHaveBeenCalledWith(
        userId,
        mockOptions,
        EAccountingEntityType.Individual
      );
      expect(result[0].name).toBe('John Doe');
      expect(result[0].type).toBe(EAccountingEntityType.Individual);
      expect(result[1]).toHaveLength(1);
      expect(result[1][0].type).toBe(EAccountingEntityEvents.Created);
    });

    it('should create a non-individual entity even if user has existing ones', async () => {
      const existingEntity = generateValidEntity(EAccountingEntityType.Company);
      mockAccountingEntityRepo.findByUserId.mockResolvedValueOnce([
        existingEntity,
      ]);

      const payload: TCreationOmits<IAccountingEntity> = {
        ...validBasePayload,
        name: 'Acme Corp',
        type: EAccountingEntityType.Company,
      };

      const result = await service.make(userId, payload, mockOptions);

      expect(mockAccountingEntityRepo.findByUserId).toHaveBeenCalledWith(
        userId,
        mockOptions,
        EAccountingEntityType.Company
      );
      expect(result[0].name).toBe('Acme Corp');
      expect(result[0].type).toBe(EAccountingEntityType.Company);
      expect(result[1]).toHaveLength(1);
      expect(result[1][0].type).toBe(EAccountingEntityEvents.Created);
    });
  });
});
