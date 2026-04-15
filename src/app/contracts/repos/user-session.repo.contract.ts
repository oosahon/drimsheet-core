import { IUserSession } from '../infra/auth-service.contract';
import { IRepoOptions } from '../infra/repo.contract';

export default interface IUserSessionRepo {
  save(userSession: IUserSession, options: IRepoOptions): Promise<void>;

  findByRefreshToken(
    userId: string,
    refreshToken: string,
    options: IRepoOptions
  ): Promise<IUserSession | null>;

  findAllByUserId(
    userId: string,
    options: IRepoOptions
  ): Promise<IUserSession[]>;

  delete(
    userId: string,
    refreshToken: string,
    options: IRepoOptions
  ): Promise<void>;
}
