import IAccountingEntityRepo from '../../../../domain/accounting/repos/accounting-entity.repo';

export const mockAccountingEntityRepo: jest.Mocked<IAccountingEntityRepo> = {
  save: jest.fn(),
};

export default mockAccountingEntityRepo;
