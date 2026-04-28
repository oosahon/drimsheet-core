import IAccountingEntityRepo from '../../../../domain/accounting/repos/accounting-entity.repo';

const mockAccountingEntityRepo: jest.Mocked<IAccountingEntityRepo> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
};

export default mockAccountingEntityRepo;
