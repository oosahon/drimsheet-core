import { ELedgerAccountEvent } from '../../../../domain/ledger/events/ledger-account.events';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
  ILedgerAccount,
} from '../../../../domain/ledger/types/ledger.types';
import { IEvent } from '../../../../shared/types/event.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import handleLedgerAccountCreatedEvent from '../ledger-account-created-event.handler';

import { NAIRA } from '../../../../domain/currency/config/currencies.config';
import mockReporter from '../../../../infra/observability/__mocks__/reporter.mock';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';

describe('handleLedgerAccountCreatedEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validEntityId = '00000000-0000-0000-0000-000000000001' as TEntityId;
  const validOwnerId = '00000000-0000-0000-0000-000000000002' as TEntityId;
  const validLedgerAccountId =
    '00000000-0000-0000-0000-000000000003' as TEntityId;

  const validLedgerAccountData: ILedgerAccount = {
    id: validLedgerAccountId,
    code: '1000',
    materializedPath: '1000',
    accountingEntityId: validEntityId,
    type: ELedgerType.Asset,
    normalBalance: ENormalBalance.Debit,
    subType: 'cash',
    behavior: 'cash',
    isControlAccount: false,
    controlAccountId: null,
    name: 'Cash',
    currency: NAIRA,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.NotApplicable,
    adjunctAccountRule: EAdjunctAccountRule.NotApplicable,
    meta: null,
    createdBy: validOwnerId,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const getValidEvent = (
    correlationId = 'corr-id-1'
  ): IEvent<ILedgerAccount> => ({
    type: ELedgerAccountEvent.Created,
    correlationId,
    occurredAt: new Date(),
    enrichedAt: null,
    data: validLedgerAccountData,
  });

  it('should successfully handle LedgerAccountCreated event', async () => {
    const handler = handleLedgerAccountCreatedEvent(
      mockReporter,
      mockRequestContext
    );

    const mockEvent = getValidEvent();
    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    await handler(mockEvent);

    // Wait for detached promises
    await new Promise(process.nextTick);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: mockEvent.correlationId,
    });
  });

  it('should generate a correlationId if not provided in the event', async () => {
    const handler = handleLedgerAccountCreatedEvent(
      mockReporter,
      mockRequestContext
    );

    const mockEvent: IEvent<ILedgerAccount> = {
      type: ELedgerAccountEvent.Created,
      occurredAt: new Date(),
      enrichedAt: null,
      data: validLedgerAccountData,
    };
    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    await handler(mockEvent);

    // Wait for detached promises
    await new Promise(process.nextTick);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: expect.any(String),
    });
  });

  it('should throw and report if event type is invalid', async () => {
    const handler = handleLedgerAccountCreatedEvent(
      mockReporter,
      mockRequestContext
    );

    const mockEvent = getValidEvent();
    mockEvent.type = 'INVALID_EVENT' as keyof typeof ELedgerAccountEvent;

    await handler(mockEvent);

    expect(mockReporter.report).toHaveBeenCalledTimes(1);
    expect(mockReporter.report.mock.calls[0][0]).toBeInstanceOf(AppError);
    expect((mockReporter.report.mock.calls[0][0] as AppError).message).toBe(
      'Event type does not match expected type'
    );
  });
});
