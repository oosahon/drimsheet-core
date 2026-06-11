import {
  IReadRepoOptions,
  IWriteRepoOptions,
} from '../../../shared/types/repo.types';
import { IUserSession } from './auth-service.contract';

export default interface IUserSessionRepo {
  save(userSession: IUserSession, options: IWriteRepoOptions): Promise<void>;

  findByRefreshToken(
    userId: string,
    refreshToken: string,
    options: IReadRepoOptions
  ): Promise<IUserSession | null>;

  findAllByUserId(
    userId: string,
    options: IReadRepoOptions
  ): Promise<IUserSession[]>;

  delete(
    userId: string,
    refreshToken: string,
    options: IWriteRepoOptions
  ): Promise<void>;
}
