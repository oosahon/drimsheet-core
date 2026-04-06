import { ICurrency } from '../../../domain/currency/types/currency.types';

export interface IIndividualSignupReq {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  reportingCurrency: ICurrency;
}
