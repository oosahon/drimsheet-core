import contractorEntity from '../../../../domain/counterparty/entities/contractor.entity';
import counterpartyEntity from '../../../../domain/counterparty/entities/counterparty.entity';
import employerEntity from '../../../../domain/counterparty/entities/employer.entity';
import vendorEntity from '../../../../domain/counterparty/entities/vendor.entity';
import mockContractorRepo from '../../../../domain/counterparty/repos/__mocks__/contractor.repo.impl.mock';
import mockCounterpartyRepo from '../../../../domain/counterparty/repos/__mocks__/counterparty.repo.impl.mock';
import mockEmployerRepo from '../../../../domain/counterparty/repos/__mocks__/employer.repo.impl.mock';
import mockVendorRepo from '../../../../domain/counterparty/repos/__mocks__/vendor.repo.impl.mock';
import {
  IContractorHistory,
  ICounterpartyHistory,
  IEmployerHistory,
  IVendorHistory,
} from '../../../../domain/counterparty/types/counterparty-audit.types';
import {
  ECounterpartyType,
  IContractor,
  ICounterparty,
  IEmployer,
  IVendor,
} from '../../../../domain/counterparty/types/counterparty.types';
import mockRepoService from '../../../../shared/contracts/__mocks__/repo.mock';
import {
  ITransactionContext,
  IWriteRepoOptions,
} from '../../../../shared/types/repo.types';
import { TEntityId } from '../../../../shared/types/uuid';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { EHistoryActorType } from '../../../../shared/values/history/types/history.types';
import makeCounterpartyPersistenceService from '../persistence.service';

describe('counterpartyPersistenceService', () => {
  const service = makeCounterpartyPersistenceService({
    counterpartyRepo: mockCounterpartyRepo,
    vendorRepo: mockVendorRepo,
    contractorRepo: mockContractorRepo,
    employerRepo: mockEmployerRepo,
    repoService: mockRepoService,
  });

  const timestamp = new Date('2026-08-01T00:00:00.000Z');
  const accountingEntityId = generateUUID();
  const correlationId = 'test-correlation-id';

  const actor = {
    type: EHistoryActorType.User,
    userId: generateUUID(),
  };

  const address = {
    line1: '1 Main Street',
    line2: null,
    city: 'Lagos',
    region: 'Lagos State',
    postalCode: '100001',
    countryCode: 'NG',
  };

  function makeCounterpartyFixture(): ICounterparty {
    const [counterparty] = counterpartyEntity.make({
      accountingEntityId,
      name: 'Test Counterparty',
      type: ECounterpartyType.Organization,
    });
    return counterparty;
  }

  function makeCounterpartyHistory(
    counterparty: ICounterparty
  ): ICounterpartyHistory {
    return {
      entityId: counterparty.id,
      action: 'created',
      actor,
      correlationId,
      occurredAt: timestamp,
      diff: { before: null, after: counterparty },
    } as unknown as ICounterpartyHistory;
  }

  function makeVendorFixture(counterPartyId: TEntityId): IVendor {
    const [vendor] = vendorEntity.make({ counterPartyId, address });
    return vendor;
  }

  function makeVendorHistory(vendor: IVendor): IVendorHistory {
    return {
      entityId: vendor.counterPartyId,
      action: 'created',
      actor,
      correlationId,
      occurredAt: timestamp,
      diff: { before: null, after: vendor },
    } as unknown as IVendorHistory;
  }

  function makeContractorFixture(counterPartyId: TEntityId): IContractor {
    const [contractor] = contractorEntity.make({ counterPartyId, address });
    return contractor;
  }

  function makeContractorHistory(contractor: IContractor): IContractorHistory {
    return {
      entityId: contractor.counterPartyId,
      action: 'created',
      actor,
      correlationId,
      occurredAt: timestamp,
      diff: { before: null, after: contractor },
    } as unknown as IContractorHistory;
  }

  function makeEmployerFixture(counterPartyId: TEntityId): IEmployer {
    const [employer] = employerEntity.make({
      counterPartyId,
      address,
      displayName: 'Test Employer Co.',
    });
    return employer;
  }

  function makeEmployerHistory(employer: IEmployer): IEmployerHistory {
    return {
      entityId: employer.counterPartyId,
      action: 'created',
      actor,
      correlationId,
      occurredAt: timestamp,
      diff: { before: null, after: employer },
    } as unknown as IEmployerHistory;
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(timestamp);
    jest.clearAllMocks();
    mockRepoService.runInTransaction
      .mockReset()
      .mockImplementation(async (transactionFn) =>
        transactionFn('mock-tx' as unknown as ITransactionContext)
      );
    mockCounterpartyRepo.create.mockResolvedValue(undefined);
    mockVendorRepo.create.mockResolvedValue(undefined);
    mockContractorRepo.create.mockResolvedValue(undefined);
    mockEmployerRepo.create.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('create', () => {
    it('should persist the counterparty directly without a transaction', async () => {
      const counterparty = makeCounterpartyFixture();
      const history = makeCounterpartyHistory(counterparty);
      const repoOptions: IWriteRepoOptions<ICounterpartyHistory> = {
        correlationId,
        history,
      };

      await service.create(counterparty, repoOptions);

      expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
      expect(mockCounterpartyRepo.create).toHaveBeenCalledTimes(1);
      expect(mockCounterpartyRepo.create).toHaveBeenCalledWith(
        counterparty,
        repoOptions
      );
    });

    it('should propagate errors from the counterparty repo', async () => {
      const counterparty = makeCounterpartyFixture();
      const history = makeCounterpartyHistory(counterparty);
      const repoOptions: IWriteRepoOptions<ICounterpartyHistory> = {
        correlationId,
        history,
      };
      const error = new Error('counterparty create failed');

      mockCounterpartyRepo.create.mockRejectedValue(error);

      await expect(service.create(counterparty, repoOptions)).rejects.toThrow(
        error
      );
    });
  });

  describe('createVendor', () => {
    it('should persist the counterparty and vendor inside a transaction', async () => {
      const counterparty = makeCounterpartyFixture();
      const vendor = makeVendorFixture(counterparty.id);
      const counterpartyHistory = makeCounterpartyHistory(counterparty);
      const vendorHistory = makeVendorHistory(vendor);
      const repoOptions: IWriteRepoOptions<
        [ICounterpartyHistory, IVendorHistory]
      > = {
        correlationId,
        history: [counterpartyHistory, vendorHistory],
      };

      await service.createVendor(counterparty, vendor, repoOptions);

      expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);

      expect(mockCounterpartyRepo.create).toHaveBeenCalledWith(counterparty, {
        ...repoOptions,
        tx: 'mock-tx',
        history: counterpartyHistory,
      });

      expect(mockVendorRepo.create).toHaveBeenCalledWith(vendor, {
        ...repoOptions,
        tx: 'mock-tx',
        history: vendorHistory,
      });
    });

    it('should not persist the vendor if counterparty creation fails', async () => {
      const counterparty = makeCounterpartyFixture();
      const vendor = makeVendorFixture(counterparty.id);
      const repoOptions: IWriteRepoOptions<
        [ICounterpartyHistory, IVendorHistory]
      > = {
        correlationId,
        history: [
          makeCounterpartyHistory(counterparty),
          makeVendorHistory(vendor),
        ],
      };
      const error = new Error('counterparty create failed');

      mockCounterpartyRepo.create.mockRejectedValue(error);

      await expect(
        service.createVendor(counterparty, vendor, repoOptions)
      ).rejects.toThrow(error);

      expect(mockCounterpartyRepo.create).toHaveBeenCalledTimes(1);
      expect(mockVendorRepo.create).not.toHaveBeenCalled();
    });

    it('should propagate errors from the vendor repo', async () => {
      const counterparty = makeCounterpartyFixture();
      const vendor = makeVendorFixture(counterparty.id);
      const repoOptions: IWriteRepoOptions<
        [ICounterpartyHistory, IVendorHistory]
      > = {
        correlationId,
        history: [
          makeCounterpartyHistory(counterparty),
          makeVendorHistory(vendor),
        ],
      };
      const error = new Error('vendor create failed');

      mockVendorRepo.create.mockRejectedValue(error);

      await expect(
        service.createVendor(counterparty, vendor, repoOptions)
      ).rejects.toThrow(error);

      expect(mockCounterpartyRepo.create).toHaveBeenCalledTimes(1);
      expect(mockVendorRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('createContractor', () => {
    it('should persist the counterparty and contractor inside a transaction', async () => {
      const counterparty = makeCounterpartyFixture();
      const contractor = makeContractorFixture(counterparty.id);
      const counterpartyHistory = makeCounterpartyHistory(counterparty);
      const contractorHistory = makeContractorHistory(contractor);
      const repoOptions: IWriteRepoOptions<
        [ICounterpartyHistory, IContractorHistory]
      > = {
        correlationId,
        history: [counterpartyHistory, contractorHistory],
      };

      await service.createContractor(counterparty, contractor, repoOptions);

      expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);

      expect(mockCounterpartyRepo.create).toHaveBeenCalledWith(counterparty, {
        ...repoOptions,
        tx: 'mock-tx',
        history: counterpartyHistory,
      });

      expect(mockContractorRepo.create).toHaveBeenCalledWith(contractor, {
        ...repoOptions,
        tx: 'mock-tx',
        history: contractorHistory,
      });
    });

    it('should not persist the contractor if counterparty creation fails', async () => {
      const counterparty = makeCounterpartyFixture();
      const contractor = makeContractorFixture(counterparty.id);
      const repoOptions: IWriteRepoOptions<
        [ICounterpartyHistory, IContractorHistory]
      > = {
        correlationId,
        history: [
          makeCounterpartyHistory(counterparty),
          makeContractorHistory(contractor),
        ],
      };
      const error = new Error('counterparty create failed');

      mockCounterpartyRepo.create.mockRejectedValue(error);

      await expect(
        service.createContractor(counterparty, contractor, repoOptions)
      ).rejects.toThrow(error);

      expect(mockCounterpartyRepo.create).toHaveBeenCalledTimes(1);
      expect(mockContractorRepo.create).not.toHaveBeenCalled();
    });

    it('should propagate errors from the contractor repo', async () => {
      const counterparty = makeCounterpartyFixture();
      const contractor = makeContractorFixture(counterparty.id);
      const repoOptions: IWriteRepoOptions<
        [ICounterpartyHistory, IContractorHistory]
      > = {
        correlationId,
        history: [
          makeCounterpartyHistory(counterparty),
          makeContractorHistory(contractor),
        ],
      };
      const error = new Error('contractor create failed');

      mockContractorRepo.create.mockRejectedValue(error);

      await expect(
        service.createContractor(counterparty, contractor, repoOptions)
      ).rejects.toThrow(error);

      expect(mockCounterpartyRepo.create).toHaveBeenCalledTimes(1);
      expect(mockContractorRepo.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('createEmployer', () => {
    it('should persist the counterparty and employer inside a transaction', async () => {
      const counterparty = makeCounterpartyFixture();
      const employer = makeEmployerFixture(counterparty.id);
      const counterpartyHistory = makeCounterpartyHistory(counterparty);
      const employerHistory = makeEmployerHistory(employer);
      const repoOptions: IWriteRepoOptions<
        [ICounterpartyHistory, IEmployerHistory]
      > = {
        correlationId,
        history: [counterpartyHistory, employerHistory],
      };

      await service.createEmployer(counterparty, employer, repoOptions);

      expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);

      expect(mockCounterpartyRepo.create).toHaveBeenCalledWith(counterparty, {
        ...repoOptions,
        tx: 'mock-tx',
        history: counterpartyHistory,
      });

      expect(mockEmployerRepo.create).toHaveBeenCalledWith(employer, {
        ...repoOptions,
        tx: 'mock-tx',
        history: employerHistory,
      });
    });

    it('should not persist the employer if counterparty creation fails', async () => {
      const counterparty = makeCounterpartyFixture();
      const employer = makeEmployerFixture(counterparty.id);
      const repoOptions: IWriteRepoOptions<
        [ICounterpartyHistory, IEmployerHistory]
      > = {
        correlationId,
        history: [
          makeCounterpartyHistory(counterparty),
          makeEmployerHistory(employer),
        ],
      };
      const error = new Error('counterparty create failed');

      mockCounterpartyRepo.create.mockRejectedValue(error);

      await expect(
        service.createEmployer(counterparty, employer, repoOptions)
      ).rejects.toThrow(error);

      expect(mockCounterpartyRepo.create).toHaveBeenCalledTimes(1);
      expect(mockEmployerRepo.create).not.toHaveBeenCalled();
    });

    it('should propagate errors from the employer repo', async () => {
      const counterparty = makeCounterpartyFixture();
      const employer = makeEmployerFixture(counterparty.id);
      const repoOptions: IWriteRepoOptions<
        [ICounterpartyHistory, IEmployerHistory]
      > = {
        correlationId,
        history: [
          makeCounterpartyHistory(counterparty),
          makeEmployerHistory(employer),
        ],
      };
      const error = new Error('employer create failed');

      mockEmployerRepo.create.mockRejectedValue(error);

      await expect(
        service.createEmployer(counterparty, employer, repoOptions)
      ).rejects.toThrow(error);

      expect(mockCounterpartyRepo.create).toHaveBeenCalledTimes(1);
      expect(mockEmployerRepo.create).toHaveBeenCalledTimes(1);
    });
  });
});
