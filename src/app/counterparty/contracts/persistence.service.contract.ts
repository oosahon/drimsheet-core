import { IWriteRepoOptions } from '@shared/types/repo.types';

import {
  IContractorHistory,
  ICounterpartyHistory,
  IEmployerHistory,
  IVendorHistory,
} from '@domain/counterparty/types/counterparty-audit.types';
import {
  IContractor,
  ICounterparty,
  IEmployer,
  IVendor,
} from '@domain/counterparty/types/counterparty.types';

export default interface ICounterpartyPersistenceService {
  create(
    counterparty: ICounterparty,
    repoOptions: IWriteRepoOptions<ICounterpartyHistory>
  ): Promise<void>;

  createVendor(
    counterparty: ICounterparty,
    vendor: IVendor,
    repoOptions: IWriteRepoOptions<[ICounterpartyHistory, IVendorHistory]>
  ): Promise<void>;

  createContractor(
    counterparty: ICounterparty,
    contractor: IContractor,
    repoOptions: IWriteRepoOptions<[ICounterpartyHistory, IContractorHistory]>
  ): Promise<void>;

  createEmployer(
    counterparty: ICounterparty,
    employer: IEmployer,
    repoOptions: IWriteRepoOptions<[ICounterpartyHistory, IEmployerHistory]>
  ): Promise<void>;
}
