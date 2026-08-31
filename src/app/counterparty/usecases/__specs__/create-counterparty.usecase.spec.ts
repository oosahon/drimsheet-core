import mockEventBus from '@shared/contracts/__mocks__/event-bus.mock';
import { TEntityId } from '@shared/types/uuid';

import makeCounterpartyService from '@domain/counterparty/services/counterparty.service';

import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '@app/context/contracts/app-context.contract';
import { mockCounterpartyService } from '@app/counterparty/contracts/__mocks__/counterparty.domain.services.mock';
import mockCounterpartyPersistenceService from '@app/counterparty/contracts/__mocks__/persistence.service.mock';
import { ICounterpartyCreateReq } from '@app/counterparty/dtos/counterparty/counterparty.dto';
import makeCreateCounterpartyUsecase from '@app/counterparty/usecases/create-counterparty.usecase';

const mockCounterpartyDomainServices = Object.freeze({
  counterparty: mockCounterpartyService,
});

describe('makeCreateCounterpartyUsecase', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  const accountingEntityId = '123e4567-e89b-12d3-a456-426614174001';
  const userId = '123e4567-e89b-12d3-a456-426614174002';

  const realCounterpartyService = makeCounterpartyService();

  let usecase: ReturnType<typeof makeCreateCounterpartyUsecase>;

  const validPayload: ICounterpartyCreateReq = {
    name: 'Jane Doe',
    status: 'active',
    type: 'individual',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext.get.mockReturnValue({
      correlationId: 'test-correlation-id',
      idempotencyKey: 'test-idempotency-key',
      user: { id: userId as TEntityId },
      accountingEntity: { id: accountingEntityId as TEntityId },
    } as IAppContextData);
    mockCounterpartyDomainServices.counterparty.create.mockImplementation(
      (payload) => realCounterpartyService.create(payload)
    );
    usecase = makeCreateCounterpartyUsecase({
      appContext: mockAppContext,
      counterpartyService: mockCounterpartyDomainServices.counterparty,
      counterpartyPersistenceService: mockCounterpartyPersistenceService,
      eventBus: mockEventBus,
    });
  });

  it('should successfully create, persist, enrich/publish events, and return a mapped DTO', async () => {
    const result = await usecase(validPayload);

    expect(
      mockCounterpartyDomainServices.counterparty.create
    ).toHaveBeenCalledWith({
      accountingEntityId,
      name: 'Jane Doe',
      type: 'individual',
      status: 'active',
    });

    expect(mockCounterpartyPersistenceService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        accountingEntityId,
        name: 'Jane Doe',
        type: 'individual',
        status: 'active',
        roles: [],
      }),
      expect.objectContaining({
        correlationId: 'test-correlation-id',
        history: expect.objectContaining({
          actor: { type: 'user', userId },
          correlationId: 'test-correlation-id',
        }),
      })
    );

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'domain:counterparty:created',
          correlationId: 'test-correlation-id',
          idempotencyKey: 'test-idempotency-key',
        }),
      ])
    );

    expect(result).toEqual({
      id: expect.any(String),
      accountingEntityId: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Jane Doe',
      status: 'active',
      type: 'individual',
      roles: [],
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    // Verify role methods are NOT called
    expect(
      mockCounterpartyDomainServices.counterparty.createVendor
    ).not.toHaveBeenCalled();
    expect(
      mockCounterpartyDomainServices.counterparty.createContractor
    ).not.toHaveBeenCalled();
    expect(
      mockCounterpartyDomainServices.counterparty.createEmployer
    ).not.toHaveBeenCalled();
    expect(
      mockCounterpartyPersistenceService.createVendor
    ).not.toHaveBeenCalled();
    expect(
      mockCounterpartyPersistenceService.createContractor
    ).not.toHaveBeenCalled();
    expect(
      mockCounterpartyPersistenceService.createEmployer
    ).not.toHaveBeenCalled();
  });

  it('should stop and throw if validation fails', async () => {
    const invalidPayload = {
      ...validPayload,
      name: '', // empty name fails validation
    };

    await expect(usecase(invalidPayload)).rejects.toThrow();

    expect(
      mockCounterpartyDomainServices.counterparty.create
    ).not.toHaveBeenCalled();
    expect(mockCounterpartyPersistenceService.create).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should stop before persistence and event publication if domain service creation fails', async () => {
    mockCounterpartyDomainServices.counterparty.create.mockImplementationOnce(
      () => {
        throw new Error('domain error');
      }
    );

    await expect(usecase(validPayload)).rejects.toThrow('domain error');

    expect(mockCounterpartyPersistenceService.create).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should stop before event publication if persistence fails', async () => {
    mockCounterpartyPersistenceService.create.mockRejectedValueOnce(
      new Error('database error')
    );

    await expect(usecase(validPayload)).rejects.toThrow('database error');

    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
