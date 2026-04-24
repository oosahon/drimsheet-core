import { EAccountingEntityEvents } from '../../../../domain/accounting-entity/events/accounting-entity.events';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../../domain/accounting-entity/types/accounting-entity.types';
import { IEvent } from '../../../../shared/types/event.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import bootstrapIndividualAccountEntityPostingAccountsHandler from '../bootstrap-individual-accounts-event.handler';

import { NAIRA } from '../../../../domain/currency/config/currencies.config';
import mockReporter from '../../../../infra/observability/__mocks__/reporter.mock';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import accountingEntityUsecase from '../../../usecases/accounting-entity';

jest.mock('../../../usecases/accounting-entity', () => ({
  __esModule: true,
  default: {
    setupNonPowerUserPostingAccounts: jest.fn(),
  },
}));

describe('bootstrapIndividualAccountEntityPostingAccountsHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validEntityId = '00000000-0000-0000-0000-000000000001' as TEntityId;
  const validOwnerId = '00000000-0000-0000-0000-000000000002' as TEntityId;

  const validAccountEntityData: IAccountingEntity = {
    id: validEntityId,
    name: 'John Doe',
    operatingCountryCode: 'NG',
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
    type: EAccountingEntityEvents.BootstrapIndividualPostingAccounts,
    correlationId,
    occurredAt: new Date(),
    enrichedAt: null,
    data: validAccountEntityData,
  });

  it('should successfully handle BootstrapIndividualPostingAccounts event', async () => {
    const handler = bootstrapIndividualAccountEntityPostingAccountsHandler(
      mockReporter,
      mockRequestContext
    );

    const mockEvent = getValidEvent();
    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    (
      accountingEntityUsecase.setupNonPowerUserPostingAccounts as jest.Mock
    ).mockResolvedValue(undefined);

    await handler(mockEvent);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: mockEvent.correlationId,
    });

    expect(
      accountingEntityUsecase.setupNonPowerUserPostingAccounts
    ).toHaveBeenCalledWith(mockEvent.data.id);
  });

  it('should generate a correlationId if not provided in the event', async () => {
    const handler = bootstrapIndividualAccountEntityPostingAccountsHandler(
      mockReporter,
      mockRequestContext
    );

    const mockEvent: IEvent<IAccountingEntity> = {
      type: EAccountingEntityEvents.BootstrapIndividualPostingAccounts,
      occurredAt: new Date(),
      enrichedAt: null,
      data: validAccountEntityData,
    };
    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    (
      accountingEntityUsecase.setupNonPowerUserPostingAccounts as jest.Mock
    ).mockResolvedValue(undefined);

    await handler(mockEvent);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: expect.any(String),
    });

    expect(
      accountingEntityUsecase.setupNonPowerUserPostingAccounts
    ).toHaveBeenCalledWith(mockEvent.data.id);
  });

  it('should throw and report if event type is invalid', async () => {
    const handler = bootstrapIndividualAccountEntityPostingAccountsHandler(
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
    expect(
      accountingEntityUsecase.setupNonPowerUserPostingAccounts
    ).not.toHaveBeenCalled();
  });

  it('should report an error if setupNonPowerUserPostingAccounts fails', async () => {
    const handler = bootstrapIndividualAccountEntityPostingAccountsHandler(
      mockReporter,
      mockRequestContext
    );

    const mockEvent = getValidEvent();
    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    const error = new Error('DB Error');
    (
      accountingEntityUsecase.setupNonPowerUserPostingAccounts as jest.Mock
    ).mockRejectedValue(error);

    await handler(mockEvent);

    expect(mockReporter.report).toHaveBeenCalledTimes(1);
    expect(mockReporter.report).toHaveBeenCalledWith(error);
  });
});
