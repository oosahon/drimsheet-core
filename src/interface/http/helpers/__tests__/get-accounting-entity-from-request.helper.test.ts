import { Request } from 'express';
import IAccountingEntityRepo from '../../../../domain/accounting-entity/repos/accounting-entity.repo';
import { IAccountingEntity } from '../../../../domain/accounting-entity/types/accounting-entity.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { ErrorBadRequest } from '../../../../shared/value-objects/error';
import getAccountingEntityFromRequest from '../get-accounting-entity-from-request.helper';

describe('getAccountingEntityFromRequest', () => {
  let mockRepo: jest.Mocked<IAccountingEntityRepo>;
  let mockReq: Partial<Request>;
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  const validUserId = 'user-id-123' as TEntityId;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IAccountingEntityRepo>;

    mockReq = {
      headers: {},
    };

    jest.clearAllMocks();
  });

  it('should return null if userId is not provided', async () => {
    const result = await getAccountingEntityFromRequest(
      mockReq as Request,
      mockRepo
    );
    expect(result).toBeNull();
  });

  it('should return null if x-accounting-entity-id header is missing', async () => {
    const result = await getAccountingEntityFromRequest(
      mockReq as Request,
      mockRepo,
      validUserId
    );
    expect(result).toBeNull();
  });

  it('should throw ErrorBadRequest if x-accounting-entity-id is not a valid UUID', async () => {
    mockReq.headers = { 'x-accounting-entity-id': 'invalid-uuid' };
    await expect(
      getAccountingEntityFromRequest(mockReq as Request, mockRepo, validUserId)
    ).rejects.toThrow(ErrorBadRequest);
  });

  it('should return null if accounting entity is not found by repo', async () => {
    mockReq.headers = {
      'x-accounting-entity-id': validUUID,
      'x-correlation-id': 'correlation-123',
    };
    mockRepo.findById.mockResolvedValue(null);

    const result = await getAccountingEntityFromRequest(
      mockReq as Request,
      mockRepo,
      validUserId
    );

    expect(mockRepo.findById).toHaveBeenCalledWith(validUUID, {
      correlationId: 'correlation-123',
    });
    expect(result).toBeNull();
  });

  it('should return the accounting entity if found', async () => {
    mockReq.headers = { 'x-accounting-entity-id': validUUID };
    const mockEntity = {
      id: validUUID,
      name: 'Test Entity',
    } as IAccountingEntity;
    mockRepo.findById.mockResolvedValue(mockEntity);

    const result = await getAccountingEntityFromRequest(
      mockReq as Request,
      mockRepo,
      validUserId
    );

    expect(mockRepo.findById).toHaveBeenCalledWith(
      validUUID,
      expect.any(Object)
    );
    expect(result).toEqual(mockEntity);
  });
});
