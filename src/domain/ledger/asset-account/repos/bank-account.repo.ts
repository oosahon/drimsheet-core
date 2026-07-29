import {
  IReadRepoOptions,
  IWriteRepoOptions,
} from '../../../../shared/types/repo.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { IBankValue } from '../types/asset-account.types';

export default interface IBankAccountRepo {
  findOne(
    bankName: string,
    accountNumber: string,
    options?: IReadRepoOptions
  ): Promise<IBankValue | null>;

  findByLedgerAccountId(
    ledgerAccountId: TEntityId,
    options?: IReadRepoOptions
  ): Promise<IBankValue | null>;

  create(
    ledgerAccountId: TEntityId,
    accountingEntityId: TEntityId,
    bankValue: IBankValue,
    options: IWriteRepoOptions<null>
  ): Promise<void>;
}
