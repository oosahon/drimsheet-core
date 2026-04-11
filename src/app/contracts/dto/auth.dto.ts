export interface IUserSignupReq {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface IAuthRes {
  authToken: string;
  refreshToken: string;
}

export interface ILoginReq {
  email: string;
  password: string;
}
