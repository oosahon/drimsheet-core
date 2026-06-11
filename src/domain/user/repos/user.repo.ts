import {
  IReadRepoOptions,
  IWriteRepoOptions,
} from '../../../shared/types/repo.types';
import { IUser } from '../types/user.types';

interface IUserRepo {
  save(user: IUser, options: IWriteRepoOptions): Promise<void>;

  findByEmail(email: string, options: IReadRepoOptions): Promise<IUser | null>;

  findById(id: string, options: IReadRepoOptions): Promise<IUser | null>;

  delete(id: string, options: IWriteRepoOptions): Promise<void>;
}

export default IUserRepo;
