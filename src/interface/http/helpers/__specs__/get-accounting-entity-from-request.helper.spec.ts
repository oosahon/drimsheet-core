import { Request } from 'express';
import { mockAccountingEntityRepo } from '../../../../app/accounting/contracts/__mocks__/accounting.repos.mock';
import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import { TEntityId } from '../../../../shared/types/uuid';
import appError from '../../../../shared/values/errors/app.error';
import getAccountingEntityFromRequest from '../get-accounting-entity-from-request.helper';

describe('getAccountingEntityFromRequest', () => {
  const mockRepo = mockAccountingEntityRepo;
  let mockReq: Partial<Request>;
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  const validUserId = 'user-id-123' as TEntityId;

  beforeEach(() => {
    mockRepo.findByIdAndUserId.mockReset();

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

  it('should throw appError.BadRequest if x-accounting-entity-id is not a valid UUID', async () => {
    mockReq.headers = { 'x-accounting-entity-id': 'invalid-uuid' };
    await expect(
      getAccountingEntityFromRequest(mockReq as Request, mockRepo, validUserId)
    ).rejects.toThrow(appError.BadRequest);
  });

  it('should return null if accounting entity is not found by repo', async () => {
    mockReq.headers = {
      'x-accounting-entity-id': validUUID,
      'x-correlation-id': 'correlation-123',
    };
    mockRepo.findByIdAndUserId.mockResolvedValue(null);

    const result = await getAccountingEntityFromRequest(
      mockReq as Request,
      mockRepo,
      validUserId
    );

    expect(mockRepo.findByIdAndUserId).toHaveBeenCalledWith(
      validUUID,
      validUserId,
      { correlationId: 'correlation-123' }
    );
    expect(result).toBeNull();
  });

  it('should return the accounting entity if found', async () => {
    mockReq.headers = { 'x-accounting-entity-id': validUUID };
    const mockEntity = {
      id: validUUID,
      name: 'Test Entity',
    } as IAccountingEntity;
    mockRepo.findByIdAndUserId.mockResolvedValue(mockEntity);

    const result = await getAccountingEntityFromRequest(
      mockReq as Request,
      mockRepo,
      validUserId
    );

    expect(mockRepo.findByIdAndUserId).toHaveBeenCalledWith(
      validUUID,
      validUserId,
      expect.any(Object)
    );
    expect(result).toEqual(mockEntity);
  });
});
