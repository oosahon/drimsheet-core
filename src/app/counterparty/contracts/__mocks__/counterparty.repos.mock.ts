import IContractorHistoryRepo from '../../../../domain/counterparty/repos/contractor-history.repo';
import IContractorRepo from '../../../../domain/counterparty/repos/contractor.repo';
import ICounterpartyHistoryRepo from '../../../../domain/counterparty/repos/counterparty-history.repo';
import ICounterpartyRepo from '../../../../domain/counterparty/repos/counterparty.repo';
import IEmployerHistoryRepo from '../../../../domain/counterparty/repos/employer-history.repo';
import IEmployerRepo from '../../../../domain/counterparty/repos/employer.repo';
import IVendorHistoryRepo from '../../../../domain/counterparty/repos/vendor-history.repo';
import IVendorRepo from '../../../../domain/counterparty/repos/vendor.repo';

export const mockContractorHistoryRepo: jest.Mocked<IContractorHistoryRepo> = {
  save: jest.fn(),
};

export const mockContractorRepo: jest.Mocked<IContractorRepo> = {
  create: jest.fn(),
};

export const mockCounterpartyHistoryRepo: jest.Mocked<ICounterpartyHistoryRepo> =
  {
    save: jest.fn(),
  };

export const mockCounterpartyRepo: jest.Mocked<ICounterpartyRepo> = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
};

export const mockEmployerHistoryRepo: jest.Mocked<IEmployerHistoryRepo> = {
  save: jest.fn(),
};

export const mockEmployerRepo: jest.Mocked<IEmployerRepo> = {
  create: jest.fn(),
};

export const mockVendorHistoryRepo: jest.Mocked<IVendorHistoryRepo> = {
  save: jest.fn(),
};

export const mockVendorRepo: jest.Mocked<IVendorRepo> = {
  create: jest.fn(),
};
