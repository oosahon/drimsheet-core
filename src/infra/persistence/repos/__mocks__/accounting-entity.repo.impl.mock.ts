import IAccountingEntityRepo from '../../../../domain/accounting-entity/repos/accounting-entity.repo';

export const mockAccountingEntityRepo: jest.Mocked<IAccountingEntityRepo> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
};

export default mockAccountingEntityRepo;
