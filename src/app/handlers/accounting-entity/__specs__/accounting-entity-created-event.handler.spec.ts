import { EAccountingEntityEvents } from '../../../../domain/accounting-entity/events/accounting-entity.events';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../../domain/accounting-entity/types/accounting-entity.types';
import { IEvent } from '../../../../shared/types/event.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import makeAccountingEntityCreatedEventHandler from '../accounting-entity-created-event.handler';

import { SYSTEM_CURRENCIES } from '../../../../domain/currency/config/currencies.config';
import mockReporter from '../../../../infra/observability/__mocks__/reporter.mock';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import userUseCase from '../../../usecases/user';

jest.mock('../../../usecases/user', () => ({
  __esModule: true,
  default: {
    saveActivity: jest.fn(),
  },
}));

describe('makeAccountingEntityCreatedEventHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validEntityId = '00000000-0000-0000-0000-000000000001' as TEntityId;
  const validOwnerId = '00000000-0000-0000-0000-000000000002' as TEntityId;

  const validAccountEntityData: IAccountingEntity = {
    accountingContextId: 'd3b07384-d113-433c-99bc-3b10b07a6279' as TEntityId,
    id: validEntityId,
    name: 'John Doe',
    operatingCountryCode: 'NG',
    type: EAccountingEntityType.Individual,
    ownerId: validOwnerId,
    functionalCurrency: {
      code: 'SYSTEM_CURRENCIES.NGN',
      name: 'Naira',
      symbol: '₦',
      minorUnit: 100n,
    },
    reportingCurrency: SYSTEM_CURRENCIES.NGN,
    fiscalYearStart: { month: 1, day: 1 },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const getValidEvent = (
    correlationId = 'corr-id-1'
  ): IEvent<IAccountingEntity> => ({
    type: EAccountingEntityEvents.Created,
    correlationId,
    occurredAt: new Date(),
    enrichedAt: null,
    data: validAccountEntityData,
  });

  it('should successfully handle AccountingEntityCreated event', async () => {
    const handler = makeAccountingEntityCreatedEventHandler(
      mockReporter,
      mockRequestContext
    );

    const mockEvent = getValidEvent();
    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    (userUseCase.saveActivity as jest.Mock).mockResolvedValue(undefined);

    await handler(mockEvent);

    // Wait for detached promises
    await new Promise(process.nextTick);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: mockEvent.correlationId,
    });

    expect(userUseCase.saveActivity).toHaveBeenCalledWith(
      mockEvent.data.ownerId,
      mockEvent
    );
  });

  it('should generate a correlationId if not provided in the event', async () => {
    const handler = makeAccountingEntityCreatedEventHandler(
      mockReporter,
      mockRequestContext
    );

    const mockEvent: IEvent<IAccountingEntity> = {
      type: EAccountingEntityEvents.Created,
      occurredAt: new Date(),
      enrichedAt: null,
      data: validAccountEntityData,
    };
    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    (userUseCase.saveActivity as jest.Mock).mockResolvedValue(undefined);

    await handler(mockEvent);

    // Wait for detached promises
    await new Promise(process.nextTick);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: expect.any(String),
    });

    expect(userUseCase.saveActivity).toHaveBeenCalledWith(
      mockEvent.data.ownerId,
      mockEvent
    );
  });

  it('should throw and report if event type is invalid', async () => {
    const handler = makeAccountingEntityCreatedEventHandler(
      mockReporter,
      mockRequestContext
    );

    const mockEvent = getValidEvent();
    mockEvent.type = 'INVALID_EVENT' as keyof typeof EAccountingEntityEvents;

    await handler(mockEvent);

    expect(mockReporter.report).toHaveBeenCalledTimes(1);
    expect(mockReporter.report.mock.calls[0][0]).toBeInstanceOf(AppError);
    expect((mockReporter.report.mock.calls[0][0] as AppError).message).toBe(
      'Event type does not match expected type'
    );
  });

  it('should report an error if transaction fails', async () => {
    const handler = makeAccountingEntityCreatedEventHandler(
      mockReporter,
      mockRequestContext
    );

    const mockEvent = getValidEvent();
    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    const error = new Error('DB Error');
    (userUseCase.saveActivity as jest.Mock).mockRejectedValue(error);

    await handler(mockEvent);

    // Wait for detached promises
    await new Promise(process.nextTick);

    expect(mockReporter.report).toHaveBeenCalledTimes(1);
    expect(mockReporter.report).toHaveBeenCalledWith(error);
  });
});
