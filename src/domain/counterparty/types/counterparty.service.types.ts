import {
  ICreateCounterpartyPayload,
  TAuditedCounterparty,
} from './counterparty.types';

export default interface ICounterpartyService {
  create(payload: ICreateCounterpartyPayload): TAuditedCounterparty;
}
