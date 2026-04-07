import accountingEntityCreatedEventHandler from '../accounting-entity-created-event.handler';
import ledgerAccountUsecase from '../../../usecases/ledger-account';
import { IEvent } from '../../../../shared/types/event.types';
import { AppError } from '../../../../shared/value-objects/error';
import {
  IAccountingEntity,
  EAccountingEntityType,
} from '../../../../domain/accounting/types/accounting.types';
import { EAccountingEntityEvents } from '../../../../domain/accounting/events/accounting-entity.events';
import { TEntityId } from '../../../../shared/types/uuid';

import MockReporter from '../../../../infra/observability/__mocks__/reporter.mock';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { NAIRA } from '../../../../domain/currency/config/currencies';

jest.mock('../../../usecases/ledger-account', () => ({
  __esModule: true,
  default: {
    setupIndividualEntityBaseAccounts: jest.fn(),
  },
}));

describe('accountingEntityCreatedEventHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validEntityId = '00000000-0000-0000-0000-000000000001' as TEntityId;
  const validOwnerId = '00000000-0000-0000-0000-000000000002' as TEntityId;

  const validAccountEntityData: IAccountingEntity = {
    id: validEntityId,
    type: EAccountingEntityType.Individual,
    ownerId: validOwnerId,
    functionalCurrency: {
      code: 'NGN',
      name: 'Naira',
      symbol: '₦',
      minorUnit: 100n,
    },
    reportingCurrency: NAIRA,
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
    const handler = accountingEntityCreatedEventHandler(
      MockReporter,
      mockRequestContext
    );

    const mockEvent = getValidEvent();
    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as any);

    (
      ledgerAccountUsecase.setupIndividualEntityBaseAccounts as jest.Mock
    ).mockResolvedValue(undefined);

    await handler(mockEvent);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: mockEvent.correlationId,
    });

    expect(
      ledgerAccountUsecase.setupIndividualEntityBaseAccounts
    ).toHaveBeenCalledWith(mockEvent.data.id);
    expect(MockReporter.report).not.toHaveBeenCalled();
  });

  it('should generate a correlationId if not provided in the event', async () => {
    const handler = accountingEntityCreatedEventHandler(
      MockReporter,
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
    } as any);

    (
      ledgerAccountUsecase.setupIndividualEntityBaseAccounts as jest.Mock
    ).mockResolvedValue(undefined);

    await handler(mockEvent);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: 'default-corr-id',
    });

    expect(
      ledgerAccountUsecase.setupIndividualEntityBaseAccounts
    ).toHaveBeenCalledWith(mockEvent.data.id);
  });

  it('should throw and report if event type is invalid', async () => {
    const handler = accountingEntityCreatedEventHandler(
      MockReporter,
      mockRequestContext
    );

    const mockEvent = getValidEvent();
    mockEvent.type = 'INVALID_EVENT' as keyof typeof EAccountingEntityEvents;

    await handler(mockEvent);

    expect(MockReporter.report).toHaveBeenCalledTimes(1);
    expect(MockReporter.report.mock.calls[0][0]).toBeInstanceOf(AppError);
    expect((MockReporter.report.mock.calls[0][0] as AppError).message).toBe(
      'Event type does not match expected type'
    );
  });

  it('should report an error if transaction fails', async () => {
    const handler = accountingEntityCreatedEventHandler(
      MockReporter,
      mockRequestContext
    );

    const mockEvent = getValidEvent();
    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as any);

    const error = new Error('DB Error');
    (
      ledgerAccountUsecase.setupIndividualEntityBaseAccounts as jest.Mock
    ).mockRejectedValue(error);

    await handler(mockEvent);

    expect(MockReporter.report).toHaveBeenCalledTimes(1);
    expect(MockReporter.report).toHaveBeenCalledWith(error);
  });
});
