import {
  IReadRepoOptions,
  IWriteRepoOptions,
} from '../../../shared/types/repo.types';
import { IUserHistory } from '../types/user-audit.types';
import { IUser } from '../types/user.types';

interface IUserRepo {
  create(user: IUser, options: IWriteRepoOptions<IUserHistory>): Promise<void>;

  update(user: IUser, options: IWriteRepoOptions<IUserHistory>): Promise<void>;

  findByEmail(email: string, options: IReadRepoOptions): Promise<IUser | null>;

  findById(id: string, options: IReadRepoOptions): Promise<IUser | null>;

  delete(id: string, options: IWriteRepoOptions): Promise<void>;
}

export default IUserRepo;
