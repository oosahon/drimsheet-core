import ICounterpartyService from '@domain/counterparty/types/counterparty.service.types';

export const mockCounterpartyService: jest.Mocked<ICounterpartyService> = {
  create: jest.fn(),
  createVendor: jest.fn(),
  createContractor: jest.fn(),
  createEmployer: jest.fn(),
};
