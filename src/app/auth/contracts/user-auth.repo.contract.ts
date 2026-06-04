import { IRepoOptions } from '../../../shared/types/repo.types';
import { IUserAuth } from '../../shared/contracts/auth-service.contract';

export default interface IUserAuthRepo {
  save(userAuth: IUserAuth, options: IRepoOptions): Promise<void>;
  findByUserId(
    userId: string,
    options: IRepoOptions
  ): Promise<IUserAuth | null>;
  update(userAuth: IUserAuth, options: IRepoOptions): Promise<void>;
  incrementFailedLoginAttempts(
    userId: string,
    options: IRepoOptions
  ): Promise<void>;
  resetFailedLoginAttempts(
    userId: string,
    options: IRepoOptions
  ): Promise<void>;
}
