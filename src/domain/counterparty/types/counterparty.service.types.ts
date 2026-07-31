import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TAuditedEntity } from '../../../shared/values/events/types/event.types';
import {
  IContractor,
  ICounterparty,
  IEmployer,
  IMakeCounterpartyPayload,
  IVendor,
} from './counterparty.types';

interface ICreateVendorResponse {
  counterparty: TAuditedEntity<ICounterparty, ICounterparty, ICounterparty>;
  vendor: TAuditedEntity<IVendor, IVendor, IVendor>;
}

interface ICreateContractorResponse {
  counterparty: TAuditedEntity<ICounterparty, ICounterparty, ICounterparty>;
  contractor: TAuditedEntity<IContractor, IContractor, IContractor>;
}

interface ICreateEmployerResponse {
  counterparty: TAuditedEntity<ICounterparty, ICounterparty, ICounterparty>;
  employer: TAuditedEntity<IEmployer, IEmployer, IEmployer>;
}

export default interface ICounterpartyService {
  createIndividual(
    payload: IMakeCounterpartyPayload
  ): TAuditedEntity<ICounterparty, ICounterparty, ICounterparty>;

  createVendor(
    payload: IMakeCounterpartyPayload,
    vendor: TCreationOmits<IVendor, 'counterPartyId'>
  ): ICreateVendorResponse;

  createContractor(
    payload: IMakeCounterpartyPayload,
    contractor: TCreationOmits<IContractor, 'counterPartyId'>
  ): ICreateContractorResponse;

  createEmployer(
    payload: IMakeCounterpartyPayload,
    employer: TCreationOmits<IEmployer, 'counterPartyId'>
  ): ICreateEmployerResponse;
}
