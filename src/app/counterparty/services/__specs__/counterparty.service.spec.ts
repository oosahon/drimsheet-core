import counterpartyError from '../../../../domain/counterparty/errors/counterparty.error';
import ICounterpartyRepo from '../../../../domain/counterparty/repos/counterparty.repo';
import makeCounterpartyService from '../../../../domain/counterparty/services/counterparty.service';
import {
  ECounterpartyType,
  ICounterparty,
} from '../../../../domain/counterparty/types/counterparty.types';
import generateUUID from '../../../../shared/utils/uuid-generator';
import makeCounterpartyAppService from '../counterparty.service';

const mockCounterpartyRepo: jest.Mocked<ICounterpartyRepo> = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
};

const domainService = makeCounterpartyService();

describe('makeCounterpartyAppService', () => {
  const service = makeCounterpartyAppService({
    counterpartyRepo: mockCounterpartyRepo,
    counterpartyService: domainService,
  });

  const accountingEntityId = generateUUID();
  const repoOptions = {
    correlationId: 'test-correlation-id',
    transaction: {} as any,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreate', () => {
    describe('when payload contains id', () => {
      it('should return existing counterparty if found', async () => {
        const id = generateUUID();
        const mockCounterparty: ICounterparty = {
          id,
          accountingEntityId,
          name: 'Jane Doe',
          type: ECounterpartyType.Individual,
          roles: [],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockCounterpartyRepo.findById.mockResolvedValueOnce(mockCounterparty);

        const result = await service.findOrCreate(
          { id, name: 'Jane Doe' },
          accountingEntityId,
          repoOptions
        );

        expect(mockCounterpartyRepo.findById).toHaveBeenCalledWith(
          id,
          accountingEntityId,
          repoOptions
        );
        expect(result).toEqual({
          new: false,
          data: [mockCounterparty, [], {}],
        });
      });

      it('should throw InvalidCounterpartyId if not found', async () => {
        const id = generateUUID();
        mockCounterpartyRepo.findById.mockResolvedValueOnce(null);

        await expect(
          service.findOrCreate(
            { id, name: 'Jane Doe' },
            accountingEntityId,
            repoOptions
          )
        ).rejects.toThrow(counterpartyError.InvalidCounterpartyId);

        expect(mockCounterpartyRepo.findById).toHaveBeenCalledWith(
          id,
          accountingEntityId,
          repoOptions
        );
      });
    });

    describe('when payload does not contain id', () => {
      it('should create and return a new counterparty with specified type', async () => {
        const result = await service.findOrCreate(
          { name: 'John Smith', type: ECounterpartyType.Organization },
          accountingEntityId,
          repoOptions
        );

        expect(mockCounterpartyRepo.findById).not.toHaveBeenCalled();
        expect(result.new).toBe(true);
        expect(result.data[0].name).toBe('John Smith');
        expect(result.data[0].type).toBe(ECounterpartyType.Organization);
        expect(result.data[1]).toHaveLength(1); // 'domain:counterparty:created' event
      });

      it('should default type to Individual if not specified', async () => {
        const result = await service.findOrCreate(
          { name: 'John Smith' },
          accountingEntityId,
          repoOptions
        );

        expect(result.new).toBe(true);
        expect(result.data[0].name).toBe('John Smith');
        expect(result.data[0].type).toBe(ECounterpartyType.Individual);
      });
    });
  });

  describe('findOrCreateMany', () => {
    it('should deduplicate names using their normalized form', async () => {
      const result = await service.findOrCreateMany(
        [{ name: 'Jane Doe' }, { name: '  Jane Doe  ' }],
        accountingEntityId,
        repoOptions
      );

      expect(result.size).toBe(1);

      const counterparty = service.getFoundOrCreated(
        { name: ' Jane Doe ' },
        result
      );

      expect(counterparty?.new).toBe(true);
      expect(counterparty?.data[0].name).toBe('Jane Doe');
    });
  });
});
