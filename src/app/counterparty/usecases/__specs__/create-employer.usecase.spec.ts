import IEventBus from '@shared/contracts/event-bus.contract';
import { TEntityId } from '@shared/types/uuid';

import makeCounterpartyService from '@domain/counterparty/services/counterparty.service';

import IAppContext from '@app/context/contracts/app-context.contract';
import { mockCounterpartyService } from '@app/counterparty/contracts/__mocks__/counterparty.domain.services.mock';
import mockCounterpartyPersistenceService from '@app/counterparty/contracts/__mocks__/persistence.service.mock';
import { IEmployerCreateReq } from '@app/counterparty/dtos/employer/employer.dto';
import makeCreateEmployerUsecase from '@app/counterparty/usecases/create-employer.usecase';

const mockCounterpartyDomainServices = Object.freeze({
  counterparty: mockCounterpartyService,
});

describe('makeCreateEmployerUsecase', () => {
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

  let usecase: ReturnType<typeof makeCreateEmployerUsecase>;

  const validPayload: IEmployerCreateReq = {
    name: 'MegaCorp Inc',
    status: 'active',
    type: 'organization',
    displayName: 'MegaCorp',
    address: {
      line1: '44 Broad Street',
      city: 'Lagos',
      countryCode: 'NG',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCounterpartyDomainServices.counterparty.createEmployer.mockImplementation(
      (payload, employer) =>
        realCounterpartyService.createEmployer(payload, employer)
    );
    usecase = makeCreateEmployerUsecase({
      appContext: mockAppContext,
      counterpartyService: mockCounterpartyDomainServices.counterparty,
      counterpartyPersistenceService: mockCounterpartyPersistenceService,
      eventBus: mockEventBus,
    });
  });

  it('should create, persist, enrich/publish events, and return a counterparty DTO with the employer role', async () => {
    const result = await usecase(validPayload);

    expect(
      mockCounterpartyDomainServices.counterparty.createEmployer
    ).toHaveBeenCalledWith(
      {
        accountingEntityId,
        name: 'MegaCorp Inc',
        type: 'organization',
        status: 'active',
      },
      {
        displayName: 'MegaCorp',
        address: expect.objectContaining({
          line1: '44 Broad Street',
          city: 'Lagos',
          countryCode: 'NG',
        }),
      }
    );

    expect(
      mockCounterpartyPersistenceService.createEmployer
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        accountingEntityId,
        name: 'MegaCorp Inc',
        type: 'organization',
        status: 'active',
        roles: ['employer'],
      }),
      expect.objectContaining({
        displayName: 'MegaCorp',
        address: expect.objectContaining({
          line1: '44 Broad Street',
          city: 'Lagos',
          countryCode: 'NG',
        }),
      }),
      expect.objectContaining({
        correlationId: 'test-correlation-id',
        history: [
          expect.objectContaining({
            actor: { type: 'user', userId },
            correlationId: 'test-correlation-id',
          }),
          expect.objectContaining({
            actor: { type: 'user', userId },
            correlationId: 'test-correlation-id',
          }),
        ],
      })
    );

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'domain:counterparty:employer:created',
          correlationId: 'test-correlation-id',
          idempotencyKey: 'test-idempotency-key',
        }),
      ])
    );

    expect(result).toEqual({
      id: expect.any(String),
      accountingEntityId: '123e4567-e89b-12d3-a456-426614174001',
      name: 'MegaCorp Inc',
      status: 'active',
      type: 'organization',
      roles: ['employer'],
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    expect(
      mockCounterpartyDomainServices.counterparty.create
    ).not.toHaveBeenCalled();
    expect(mockCounterpartyPersistenceService.create).not.toHaveBeenCalled();
  });

  it('should pass a null employer display name when displayName is omitted', async () => {
    await usecase({
      name: 'MegaCorp Inc',
      status: 'active',
      type: 'organization',
      address: validPayload.address,
    });

    expect(
      mockCounterpartyDomainServices.counterparty.createEmployer
    ).toHaveBeenCalledWith(expect.any(Object), {
      displayName: null,
      address: expect.any(Object),
    });
  });

  it('should stop and throw if validation fails', async () => {
    const invalidPayload = {
      ...validPayload,
      name: '',
    };

    await expect(usecase(invalidPayload)).rejects.toThrow();

    expect(
      mockCounterpartyDomainServices.counterparty.createEmployer
    ).not.toHaveBeenCalled();
    expect(
      mockCounterpartyPersistenceService.createEmployer
    ).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should stop before persistence and event publication if domain service creation fails', async () => {
    mockCounterpartyDomainServices.counterparty.createEmployer.mockImplementationOnce(
      () => {
        throw new Error('domain error');
      }
    );

    await expect(usecase(validPayload)).rejects.toThrow('domain error');

    expect(
      mockCounterpartyPersistenceService.createEmployer
    ).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should stop before event publication if persistence fails', async () => {
    mockCounterpartyPersistenceService.createEmployer.mockRejectedValueOnce(
      new Error('database error')
    );

    await expect(usecase(validPayload)).rejects.toThrow('database error');

    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
