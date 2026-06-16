import { EUserEvents } from '../../../../domain/user/events/user.events';
import { IUser } from '../../../../domain/user/types/user.types';
import eventError from '../../../../shared/errors/event.error';
import { IEvent } from '../../../../shared/types/event.types';
import { TEntityId } from '../../../../shared/types/uuid';
import makeUserCreatedEventHandler from '../user-created-event.handler';

import MockReporter from '../../../../infra/observability/__mocks__/reporter.mock';
import mockRequestContext from '../../../../infra/services/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../../shared/contracts/request-context.contract';
import authUseCase from '../../../auth/usecases';

jest.mock('../../../auth/usecases', () => ({
  __esModule: true,
  default: {
    sendEmailVerificationEmail: jest.fn(),
  },
}));

describe('makeUserCreatedEventHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validUserId = '00000000-0000-0000-0000-000000000001' as TEntityId;

  const validUserData: IUser = {
    id: validUserId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const getValidEvent = (correlationId = 'corr-id-1'): IEvent<IUser> => ({
    type: EUserEvents.Created,
    correlationId,
    occurredAt: new Date(),
    enrichedAt: null,
    data: validUserData,
  });

  it('should successfully handle Created event and send verification email if not verified', async () => {
    const handler = makeUserCreatedEventHandler(
      MockReporter,
      mockRequestContext
    );
    const mockEvent = getValidEvent();

    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    (authUseCase.sendEmailVerificationEmail as jest.Mock).mockResolvedValue(
      undefined
    );

    await handler(mockEvent);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: mockEvent.correlationId,
    });
    expect(authUseCase.sendEmailVerificationEmail).toHaveBeenCalledWith(
      mockEvent.data.email
    );
  });

  it('should generate a correlationId if not provided in the event', async () => {
    const handler = makeUserCreatedEventHandler(
      MockReporter,
      mockRequestContext
    );
    const mockEvent: IEvent<IUser> = {
      type: EUserEvents.Created,
      occurredAt: new Date(),
      enrichedAt: null,
      data: validUserData,
    };

    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    (authUseCase.sendEmailVerificationEmail as jest.Mock).mockResolvedValue(
      undefined
    );

    await handler(mockEvent);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: expect.any(String),
    });
    expect(authUseCase.sendEmailVerificationEmail).toHaveBeenCalledWith(
      mockEvent.data.email
    );
  });

  it('should successfully handle Created event and NOT send verification email if already verified', async () => {
    const handler = makeUserCreatedEventHandler(
      MockReporter,
      mockRequestContext
    );
    const mockEvent = getValidEvent();
    mockEvent.data = { ...validUserData, emailVerified: true };

    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    await handler(mockEvent);

    expect(authUseCase.sendEmailVerificationEmail).not.toHaveBeenCalled();
  });

  it('should throw and report if event type is invalid', async () => {
    const handler = makeUserCreatedEventHandler(
      MockReporter,
      mockRequestContext
    );
    const mockEvent = getValidEvent();
    mockEvent.type = 'INVALID_EVENT' as keyof typeof EUserEvents;

    await handler(mockEvent);

    expect(MockReporter.report).toHaveBeenCalledTimes(1);
    expect(MockReporter.report.mock.calls[0][0]).toBeInstanceOf(
      eventError.EventTypeMismatch
    );

    expect(authUseCase.sendEmailVerificationEmail).not.toHaveBeenCalled();
  });

  it('should report an error if sendEmailVerificationEmail fails', async () => {
    const handler = makeUserCreatedEventHandler(
      MockReporter,
      mockRequestContext
    );
    const mockEvent = getValidEvent();

    const error = new Error('Email Error');
    (authUseCase.sendEmailVerificationEmail as jest.Mock).mockRejectedValue(
      error
    );

    await handler(mockEvent);

    expect(MockReporter.report).toHaveBeenCalledWith(error);
  });
});
