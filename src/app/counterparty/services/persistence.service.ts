import IContractorHistoryRepo from '../../../domain/counterparty/repos/contractor-history.repo';
import IContractorRepo from '../../../domain/counterparty/repos/contractor.repo';
import ICounterpartyRepo from '../../../domain/counterparty/repos/counterparty.repo';
import IEmployerHistoryRepo from '../../../domain/counterparty/repos/employer-history.repo';
import IEmployerRepo from '../../../domain/counterparty/repos/employer.repo';
import IVendorHistoryRepo from '../../../domain/counterparty/repos/vendor-history.repo';
import IVendorRepo from '../../../domain/counterparty/repos/vendor.repo';
import { IRepoService } from '../../../shared/contracts/repo.contract';
import ICounterpartyPersistenceService from '../contracts/persistence.service.contract';

interface IDependencies {
  counterpartyRepo: ICounterpartyRepo;
  vendorRepo: IVendorRepo;
  vendorHistoryRepo: IVendorHistoryRepo;
  contractorRepo: IContractorRepo;
  contractorHistoryRepo: IContractorHistoryRepo;
  employerRepo: IEmployerRepo;
  employerHistoryRepo: IEmployerHistoryRepo;
  repoService: IRepoService;
}

function makeCreateIndividual(
  deps: IDependencies
): ICounterpartyPersistenceService['createIndividual'] {
  return async (counterparty, repoOptions) => {
    await deps.counterpartyRepo.create(counterparty, repoOptions);
  };
}

function makeCreateVendor(
  deps: IDependencies
): ICounterpartyPersistenceService['createVendor'] {
  return async (counterparty, vendor, repoOptions) => {
    const [counterpartyHistory, vendorHistory] = repoOptions.history;

    await deps.repoService.runInTransaction(async (tx) => {
      const writeOptions = { ...repoOptions, tx };

      await deps.counterpartyRepo.create(counterparty, {
        ...writeOptions,
        history: counterpartyHistory,
      });

      await deps.vendorRepo.create(vendor, {
        ...writeOptions,
        history: vendorHistory,
      });
    });
  };
}

function makeCreateContractor(
  deps: IDependencies
): ICounterpartyPersistenceService['createContractor'] {
  return async (counterparty, contractor, repoOptions) => {
    const [counterpartyHistory, contractorHistory] = repoOptions.history;

    await deps.repoService.runInTransaction(async (tx) => {
      const writeOptions = { ...repoOptions, tx };

      await deps.counterpartyRepo.create(counterparty, {
        ...writeOptions,
        history: counterpartyHistory,
      });
      await deps.contractorRepo.create(contractor, {
        ...writeOptions,
        history: contractorHistory,
      });
    });
  };
}

function makeCreateEmployer(
  deps: IDependencies
): ICounterpartyPersistenceService['createEmployer'] {
  return async (counterparty, employer, repoOptions) => {
    const [counterpartyHistory, employerHistory] = repoOptions.history;

    await deps.repoService.runInTransaction(async (tx) => {
      const writeOptions = { ...repoOptions, tx };

      await deps.counterpartyRepo.create(counterparty, {
        ...writeOptions,
        history: counterpartyHistory,
      });
      await deps.employerRepo.create(employer, {
        ...writeOptions,
        history: employerHistory,
      });
    });
  };
}

export default function makeCounterpartyPersistenceService(
  deps: IDependencies
): ICounterpartyPersistenceService {
  const service = {
    createIndividual: makeCreateIndividual(deps),
    createVendor: makeCreateVendor(deps),
    createContractor: makeCreateContractor(deps),
    createEmployer: makeCreateEmployer(deps),
  };

  return Object.freeze(service);
}
