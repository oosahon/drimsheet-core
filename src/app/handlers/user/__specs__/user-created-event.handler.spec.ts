import { EUserEvents } from '../../../../domain/user/events/user.events';
import { IUser } from '../../../../domain/user/types/user.types';
import { IEvent } from '../../../../shared/types/event.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import userCreatedEventHandler from '../user-created-event.handler';

import MockReporter from '../../../../infra/observability/__mocks__/reporter.mock';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import authUseCase from '../../../usecases/auth';
import userUseCase from '../../../usecases/user';

jest.mock('../../../usecases/auth', () => ({
  __esModule: true,
  default: {
    sendEmailVerificationEmail: jest.fn(),
  },
}));

jest.mock('../../../usecases/user', () => ({
  __esModule: true,
  default: {
    saveActivity: jest.fn(),
  },
}));

describe('userCreatedEventHandler', () => {
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
    const handler = userCreatedEventHandler(MockReporter, mockRequestContext);
    const mockEvent = getValidEvent();

    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    (userUseCase.saveActivity as jest.Mock).mockResolvedValue(undefined);
    (authUseCase.sendEmailVerificationEmail as jest.Mock).mockResolvedValue(
      undefined
    );

    await handler(mockEvent);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: mockEvent.correlationId,
    });
    expect(userUseCase.saveActivity).toHaveBeenCalledWith(
      mockEvent.data.id,
      mockEvent
    );
    expect(authUseCase.sendEmailVerificationEmail).toHaveBeenCalledWith(
      mockEvent.data.email
    );
  });

  it('should generate a correlationId if not provided in the event', async () => {
    const handler = userCreatedEventHandler(MockReporter, mockRequestContext);
    const mockEvent: IEvent<IUser> = {
      type: EUserEvents.Created,
      occurredAt: new Date(),
      enrichedAt: null,
      data: validUserData,
    };

    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    (userUseCase.saveActivity as jest.Mock).mockResolvedValue(undefined);
    (authUseCase.sendEmailVerificationEmail as jest.Mock).mockResolvedValue(
      undefined
    );

    await handler(mockEvent);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: expect.any(String),
    });
    expect(userUseCase.saveActivity).toHaveBeenCalledWith(
      mockEvent.data.id,
      mockEvent
    );
    expect(authUseCase.sendEmailVerificationEmail).toHaveBeenCalledWith(
      mockEvent.data.email
    );
  });

  it('should successfully handle Created event and NOT send verification email if already verified', async () => {
    const handler = userCreatedEventHandler(MockReporter, mockRequestContext);
    const mockEvent = getValidEvent();
    mockEvent.data = { ...validUserData, emailVerified: true };

    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    (userUseCase.saveActivity as jest.Mock).mockResolvedValue(undefined);

    await handler(mockEvent);

    expect(userUseCase.saveActivity).toHaveBeenCalledWith(
      mockEvent.data.id,
      mockEvent
    );
    expect(authUseCase.sendEmailVerificationEmail).not.toHaveBeenCalled();
  });

  it('should throw and report if event type is invalid', async () => {
    const handler = userCreatedEventHandler(MockReporter, mockRequestContext);
    const mockEvent = getValidEvent();
    mockEvent.type = 'INVALID_EVENT' as keyof typeof EUserEvents;

    await handler(mockEvent);

    expect(MockReporter.report).toHaveBeenCalledTimes(1);
    expect(MockReporter.report.mock.calls[0][0]).toBeInstanceOf(AppError);
    expect((MockReporter.report.mock.calls[0][0] as AppError).message).toBe(
      'Event type does not match expected type'
    );
    expect(userUseCase.saveActivity).not.toHaveBeenCalled();
    expect(authUseCase.sendEmailVerificationEmail).not.toHaveBeenCalled();
  });

  it('should report an error if saveActivity fails', async () => {
    const handler = userCreatedEventHandler(MockReporter, mockRequestContext);
    const mockEvent = getValidEvent();

    const error = new Error('DB Error');
    (userUseCase.saveActivity as jest.Mock).mockRejectedValue(error);
    (authUseCase.sendEmailVerificationEmail as jest.Mock).mockResolvedValue(
      undefined
    );

    await handler(mockEvent);

    expect(MockReporter.report).toHaveBeenCalledWith(error);
    expect(authUseCase.sendEmailVerificationEmail).toHaveBeenCalled();
  });

  it('should report an error if sendEmailVerificationEmail fails', async () => {
    const handler = userCreatedEventHandler(MockReporter, mockRequestContext);
    const mockEvent = getValidEvent();

    const error = new Error('Email Error');
    (userUseCase.saveActivity as jest.Mock).mockResolvedValue(undefined);
    (authUseCase.sendEmailVerificationEmail as jest.Mock).mockRejectedValue(
      error
    );

    await handler(mockEvent);

    expect(MockReporter.report).toHaveBeenCalledWith(error);
  });
});
