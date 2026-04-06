import { ICurrency } from '../../../domain/currency/types/currency.types';
import { IMoneyDto } from './money.dto';

export interface IIndividualSignupReq {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  reportingCurrencyCode: string;
}
