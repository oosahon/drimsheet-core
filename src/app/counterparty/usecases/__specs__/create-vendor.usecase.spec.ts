import makeCounterpartyService from '../../../../domain/counterparty/services/counterparty.service';
import IEventBus from '../../../../shared/contracts/event-bus.contract';
import { TEntityId } from '../../../../shared/types/uuid';
import IAppContext from '../../../context/contracts/app-context.contract';
import mockCounterpartyPersistenceService from '../../contracts/__mocks__/persistence.service.mock';
import { IVendorCreateReq } from '../../dtos/vendor/vendor.dto';
import makeCreateVendorUsecase from '../create-vendor.usecase';

import { mockCounterpartyService } from '../../contracts/__mocks__/counterparty.domain.services.mock';

const mockCounterpartyDomainServices = Object.freeze({
  counterparty: mockCounterpartyService,
});

describe('makeCreateVendorUsecase', () => {
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

  let usecase: ReturnType<typeof makeCreateVendorUsecase>;

  const validPayload: IVendorCreateReq = {
    name: 'Acme Supplies',
    status: 'active',
    type: 'organization',
    address: {
      line1: '12 Market Street',
      city: 'Lagos',
      countryCode: 'NG',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCounterpartyDomainServices.counterparty.createVendor.mockImplementation(
      (payload, vendor) => realCounterpartyService.createVendor(payload, vendor)
    );
    usecase = makeCreateVendorUsecase({
      appContext: mockAppContext,
      counterpartyService: mockCounterpartyDomainServices.counterparty,
      counterpartyPersistenceService: mockCounterpartyPersistenceService,
      eventBus: mockEventBus,
    });
  });

  it('should create, persist, enrich/publish events, and return a counterparty DTO with the vendor role', async () => {
    const result = await usecase(validPayload);

    expect(
      mockCounterpartyDomainServices.counterparty.createVendor
    ).toHaveBeenCalledWith(
      {
        accountingEntityId,
        name: 'Acme Supplies',
        type: 'organization',
        status: 'active',
      },
      {
        address: expect.objectContaining({
          line1: '12 Market Street',
          city: 'Lagos',
          countryCode: 'NG',
        }),
      }
    );

    expect(
      mockCounterpartyPersistenceService.createVendor
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        accountingEntityId,
        name: 'Acme Supplies',
        type: 'organization',
        status: 'active',
        roles: ['vendor'],
      }),
      expect.objectContaining({
        address: expect.objectContaining({
          line1: '12 Market Street',
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
          type: 'domain:counterparty:vendor:created',
          correlationId: 'test-correlation-id',
          idempotencyKey: 'test-idempotency-key',
        }),
      ])
    );

    expect(result).toEqual({
      id: expect.any(String),
      accountingEntityId: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Acme Supplies',
      status: 'active',
      type: 'organization',
      roles: ['vendor'],
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    expect(
      mockCounterpartyDomainServices.counterparty.create
    ).not.toHaveBeenCalled();
    expect(mockCounterpartyPersistenceService.create).not.toHaveBeenCalled();
  });

  it('should pass a null vendor address when address is omitted', async () => {
    await usecase({
      name: 'Acme Supplies',
      status: 'active',
      type: 'organization',
    });

    expect(
      mockCounterpartyDomainServices.counterparty.createVendor
    ).toHaveBeenCalledWith(expect.any(Object), {
      address: null,
    });
  });

  it('should stop and throw if validation fails', async () => {
    const invalidPayload = {
      ...validPayload,
      name: '',
    };

    await expect(usecase(invalidPayload)).rejects.toThrow();

    expect(
      mockCounterpartyDomainServices.counterparty.createVendor
    ).not.toHaveBeenCalled();
    expect(
      mockCounterpartyPersistenceService.createVendor
    ).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should stop before persistence and event publication if domain service creation fails', async () => {
    mockCounterpartyDomainServices.counterparty.createVendor.mockImplementationOnce(
      () => {
        throw new Error('domain error');
      }
    );

    await expect(usecase(validPayload)).rejects.toThrow('domain error');

    expect(
      mockCounterpartyPersistenceService.createVendor
    ).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('should stop before event publication if persistence fails', async () => {
    mockCounterpartyPersistenceService.createVendor.mockRejectedValueOnce(
      new Error('database error')
    );

    await expect(usecase(validPayload)).rejects.toThrow('database error');

    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
