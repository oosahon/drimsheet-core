import mockEventBus from '@shared/contracts/__mocks__/event-bus.mock';
import { TEntityId } from '@shared/types/uuid';

import makeCounterpartyService from '@domain/counterparty/services/counterparty.service';

import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '@app/context/contracts/app-context.contract';
import { mockCounterpartyService } from '@app/counterparty/contracts/__mocks__/counterparty.domain.services.mock';
import mockCounterpartyPersistenceService from '@app/counterparty/contracts/__mocks__/persistence.service.mock';
import { IContractorCreateReq } from '@app/counterparty/dtos/contractor/contractor.dto';
import makeCreateContractorUsecase from '@app/counterparty/usecases/create-contractor.usecase';

const mockCounterpartyDomainServices = Object.freeze({
  counterparty: mockCounterpartyService,
});

describe('makeCreateContractorUsecase', () => {
  const accountingEntityId = '123e4567-e89b-12d3-a456-426614174001';
  const userId = '123e4567-e89b-12d3-a456-426614174002';

  const realCounterpartyService = makeCounterpartyService();

  let usecase: ReturnType<typeof makeCreateContractorUsecase>;

  const validPayload: IContractorCreateReq = {
    name: 'Ada Builder',
    status: 'active',
    type: 'individual',
    address: {
      line1: '7 Marina Road',
      city: 'Lagos',
      countryCode: 'NG',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext.get.mockReturnValue({
      correlationId: 'test-correlation-id',
      idempotencyKey: 'test-idempotency-key',
      user: { id: userId as TEntityId },
      accountingEntity: { id: accountingEntityId as TEntityId },
    } as IAppContextData);
    mockCounterpartyDomainServices.counterparty.createContractor.mockImplementation(
      (payload, contractor) =>
        realCounterpartyService.createContractor(payload, contractor)
    );
    usecase = makeCreateContractorUsecase({
      appContext: mockAppContext,
      counterpartyService: mockCounterpartyDomainServices.counterparty,
      counterpartyPersistenceService: mockCounterpartyPersistenceService,
      eventBus: mockEventBus,
    });
  });

  it('should create, persist, enrich/publish events, and return a counterparty DTO with the contractor role', async () => {
    const result = await usecase(validPayload);

    expect(
      mockCounterpartyDomainServices.counterparty.createContractor
    ).toHaveBeenCalledWith(
      {
        accountingEntityId,
        name: 'Ada Builder',
        type: 'individual',
        status: 'active',
      },
      {
        address: expect.objectContaining({
          line1: '7 Marina Road',
          city: 'Lagos',
          countryCode: 'NG',
        }),
      }
    );

    expect(
      mockCounterpartyPersistenceService.createContractor
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        accountingEntityId,
        name: 'Ada Builder',
        type: 'individual',
        status: 'active',
        roles: ['contractor'],
      }),
      expect.objectContaining({
        address: expect.objectContaining({
          line1: '7 Marina Road',
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
          type: 'domain:counterparty:contractor:created',
          correlationId: 'test-correlation-id',
          idempotencyKey: 'test-idempotency-key',
        }),
      ])
    );

    expect(result).toEqual({
      id: expect.any(String),
      accountingEntityId: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Ada Builder',
      status: 'active',
      type: 'individual',
      roles: ['contractor'],
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    expect(
      mockCounterpartyDomainServices.counterparty.create
    ).not.toHaveBeenCalled();
    expect(mockCounterpartyPersistenceService.create).not.toHaveBeenCalled();
  });

  it('should stop and throw if validation fails', async () => {
    const invalidPayload = {
      ...validPayload,
      name: '',
    };

    await expect(usecase(invalidPayload)).rejects.toThrow();

    expect(
      mockCounterpartyDomainServices.counterparty.createContractor
    ).not.toHaveBeenCalled();
    expect(
      mockCounterpartyPersistenceService.createContractor
    ).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should stop before persistence and event publication if domain service creation fails', async () => {
    mockCounterpartyDomainServices.counterparty.createContractor.mockImplementationOnce(
      () => {
        throw new Error('domain error');
      }
    );

    await expect(usecase(validPayload)).rejects.toThrow('domain error');

    expect(
      mockCounterpartyPersistenceService.createContractor
    ).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should stop before event publication if persistence fails', async () => {
    mockCounterpartyPersistenceService.createContractor.mockRejectedValueOnce(
      new Error('database error')
    );

    await expect(usecase(validPayload)).rejects.toThrow('database error');

    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
