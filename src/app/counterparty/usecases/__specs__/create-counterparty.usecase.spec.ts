import mockCounterpartyDomainServices from '../../../../domain/counterparty/services/__mocks__/counterparty.service.mock';
import makeCounterpartyService from '../../../../domain/counterparty/services/counterparty.service';
import IEventBus from '../../../../shared/contracts/event-bus.contract';
import { TEntityId } from '../../../../shared/types/uuid';
import IAppContext from '../../../context/contracts/app-context.contract';
import mockCounterpartyPersistenceService from '../../contracts/__mocks__/persistence.service.mock';
import { ICounterpartyCreateReq } from '../../dtos/counterparty/counterparty.dto';
import makeCreateCounterpartyUsecase from '../create-counterparty.usecase';

describe('makeCreateCounterpartyUsecase', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';
  const accountingEntityId = '123e4567-e89b-12d3-a456-426614174001';
  const userId = '123e4567-e89b-12d3-a456-426614174002';

  const mockAppContext = {
    get: jest.fn().mockReturnValue({
      correlationId: 'test-correlation-id',
      idempotencyKey: 'test-idempotency-key',
      user: { id: userId as TEntityId },
      accountingEntity: { id: accountingEntityId as TEntityId },
    }),
  } as unknown as jest.Mocked<IAppContext>;

  const realCounterpartyService = makeCounterpartyService();

  const mockEventBus = {
    publish: jest.fn(),
  } as unknown as jest.Mocked<IEventBus>;

  let usecase: ReturnType<typeof makeCreateCounterpartyUsecase>;

  const validPayload: ICounterpartyCreateReq = {
    name: 'Jane Doe',
    status: 'active',
    type: 'individual',
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
