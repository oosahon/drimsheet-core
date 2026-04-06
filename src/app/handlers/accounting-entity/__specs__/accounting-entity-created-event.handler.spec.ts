import accountingEntityCreatedEventHandler from '../accounting-entity-created-event.handler';
import ledgerService from '../../../../domain/ledger/services/ledger.service';
import { IEvent } from '../../../../shared/types/event.types';
import { AppError } from '../../../../shared/value-objects/error';
import {
  IAccountingEntity,
  EAccountingEntityType,
} from '../../../../domain/accounting/types/accounting.types';
import { EAccountingEntityEvents } from '../../../../domain/accounting/events/accounting-entity.events';
import { ITransactionContext } from '../../../contracts/infra/repo.contract';
import { TEntityId } from '../../../../shared/types/uuid';

import MockReporter from '../../../../infra/observability/__mocks__/reporter.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import mockDbService from '../../../../infra/services/__mocks__/repo.service.mock';
import { NAIRA } from '../../../bootstrap/data/currencies';

jest.mock('../../../../domain/ledger/services/ledger.service');

describe('accountingEntityCreatedEventHandler', () => {
  const mockSetupBaseIndividualAccounts = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (ledgerService as jest.Mock).mockReturnValue({
      setupBaseIndividualAccounts: mockSetupBaseIndividualAccounts,
    });
  });

  const validEntityId = '00000000-0000-0000-0000-000000000001' as TEntityId;
  const validOwnerId = '00000000-0000-0000-0000-000000000002' as TEntityId;

  it('should successfully handle AccountingEntityCreated event', async () => {
    const handler = accountingEntityCreatedEventHandler(
      MockReporter,
      mockLedgerAccountRepo,
      mockDbService
    );

    const mockEvent: IEvent<IAccountingEntity> = {
      type: EAccountingEntityEvents.Created,
      correlationId: 'corr-id-1',
      occurredAt: new Date(),
      data: {
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
      },
    };

    const mockTx = { txId: 'tx-1' };
    mockDbService.runInTransaction.mockImplementation(async (cb) => {
      return await cb(mockTx as unknown as ITransactionContext);
    });

    const mockEntitiesAndEvents = [
      [{ id: 'entity-1' }, [{ id: 'event-1' }]],
      [{ id: 'entity-2' }, [{ id: 'event-2' }]],
    ];
    mockSetupBaseIndividualAccounts.mockResolvedValue(mockEntitiesAndEvents);

    await handler(mockEvent);

    expect(mockDbService.runInTransaction).toHaveBeenCalledTimes(1);
    expect(ledgerService).toHaveBeenCalledWith(mockLedgerAccountRepo);
    expect(mockSetupBaseIndividualAccounts).toHaveBeenCalledWith(
      {
        userId: mockEvent.data.ownerId,
        accountingEntityId: mockEvent.data.id,
        functionalCurrency: mockEvent.data.functionalCurrency,
      },
      {
        tx: mockTx,
        correlationId: mockEvent.correlationId,
      }
    );

    expect(mockLedgerAccountRepo.save).toHaveBeenCalledTimes(2);
    expect(mockLedgerAccountRepo.save).toHaveBeenNthCalledWith(
      1,
      { id: 'entity-1' },
      { tx: mockTx, correlationId: mockEvent.correlationId }
    );
    expect(mockLedgerAccountRepo.save).toHaveBeenNthCalledWith(
      2,
      { id: 'entity-2' },
      { tx: mockTx, correlationId: mockEvent.correlationId }
    );
  });

  it('should generate a correlationId if not provided in the event', async () => {
    const handler = accountingEntityCreatedEventHandler(
      MockReporter,
      mockLedgerAccountRepo,
      mockDbService
    );

    const mockEvent: IEvent<IAccountingEntity> = {
      type: EAccountingEntityEvents.Created,
      occurredAt: new Date(),
      data: {
        id: validEntityId,
        type: EAccountingEntityType.Individual,
        ownerId: validOwnerId,
        functionalCurrency: {
          code: 'NGN',
          name: 'Naira',
          symbol: '₦',
          minorUnit: 100n,
        },
        reportingCurrency: {
          code: 'NGN',
          name: 'Naira',
          symbol: '₦',
          minorUnit: 100n,
        },
        fiscalYearStart: { month: 1, day: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      // correlationId is missing
    };

    const mockTx = { txId: 'tx-1' };
    mockDbService.runInTransaction.mockImplementation(async (cb) => {
      return await cb(mockTx as unknown as ITransactionContext);
    });

    mockSetupBaseIndividualAccounts.mockResolvedValue([]);

    await handler(mockEvent);

    expect(mockDbService.runInTransaction).toHaveBeenCalledTimes(1);
    expect(mockSetupBaseIndividualAccounts).toHaveBeenCalledTimes(1);
    const callArgs = mockSetupBaseIndividualAccounts.mock.calls[0];
    expect(callArgs[1].correlationId).toBeDefined(); // should be a UUID
  });

  it('should throw and report if event type is invalid', async () => {
    const handler = accountingEntityCreatedEventHandler(
      MockReporter,
      mockLedgerAccountRepo,
      mockDbService
    );

    const mockEvent: IEvent<IAccountingEntity> = {
      type: 'INVALID_EVENT' as EAccountingEntityEvents,
      correlationId: 'corr-id-1',
      occurredAt: new Date(),
      data: {} as IAccountingEntity,
    };

    await handler(mockEvent);

    expect(mockDbService.runInTransaction).not.toHaveBeenCalled();
    expect(MockReporter.report).toHaveBeenCalledTimes(1);
    expect(MockReporter.report.mock.calls[0][0]).toBeInstanceOf(AppError);
    expect((MockReporter.report.mock.calls[0][0] as AppError).message).toBe(
      'Invalid event type passed to accounting entity created event handler'
    );
  });

  it('should report an error if transaction fails', async () => {
    const handler = accountingEntityCreatedEventHandler(
      MockReporter,
      mockLedgerAccountRepo,
      mockDbService
    );

    const mockEvent: IEvent<IAccountingEntity> = {
      type: EAccountingEntityEvents.Created,
      correlationId: 'corr-id-1',
      occurredAt: new Date(),
      data: {
        id: validEntityId,
        type: EAccountingEntityType.Individual,
        ownerId: validOwnerId,
        functionalCurrency: {
          code: 'NGN',
          name: 'Naira',
          symbol: '₦',
          minorUnit: 100n,
        },
        reportingCurrency: {
          code: 'NGN',
          name: 'Naira',
          symbol: '₦',
          minorUnit: 100n,
        },
        fiscalYearStart: { month: 1, day: 1 },
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    };

    const error = new Error('DB Error');
    mockDbService.runInTransaction.mockRejectedValue(error);

    await handler(mockEvent);

    expect(MockReporter.report).toHaveBeenCalledTimes(1);
    expect(MockReporter.report).toHaveBeenCalledWith(error);
  });
});
