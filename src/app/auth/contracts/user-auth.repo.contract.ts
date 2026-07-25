import {
  IReadRepoOptions,
  IWriteRepoOptions,
} from '../../../shared/types/repo.types';
import { IUserAuth } from './auth.types';

export default interface IUserAuthRepo {
  create(userAuth: IUserAuth, options: IWriteRepoOptions): Promise<void>;
  findByUserId(
    userId: string,
    options: IReadRepoOptions
  ): Promise<IUserAuth | null>;
  update(userAuth: IUserAuth, options: IWriteRepoOptions): Promise<void>;
  incrementFailedLoginAttempts(
    userId: string,
    options: IWriteRepoOptions
  ): Promise<void>;
  resetFailedLoginAttempts(
    userId: string,
    options: IWriteRepoOptions
  ): Promise<void>;
}
