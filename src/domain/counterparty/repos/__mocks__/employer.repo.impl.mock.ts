import IEmployerRepo from '../employer.repo';

const mockEmployerRepo: jest.Mocked<IEmployerRepo> = {
  create: jest.fn(),
};

export default mockEmployerRepo;
