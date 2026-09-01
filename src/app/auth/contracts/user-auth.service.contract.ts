import { IUserAuth, UAuthStrategy } from '@app/auth/contracts/auth.types';

interface IMakeUserAuthPayload extends Pick<IUserAuth, 'userId' | 'password'> {
  strategy: UAuthStrategy;
}

export default interface IUserAuthService {
  make(payload: IMakeUserAuthPayload): IUserAuth;
  addStrategy(userAuth: IUserAuth, strategy: UAuthStrategy): IUserAuth;
  replacePassword(userAuth: IUserAuth, password: string): IUserAuth;
  recordFailedLogin(userAuth: IUserAuth): IUserAuth;
  resetFailedLoginAttempts(userAuth: IUserAuth): IUserAuth;
}
