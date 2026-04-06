import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TEntityId } from '../../../shared/types/uuid';
import { ILedgerAccount } from '../types/ledger.types';

export default interface ILedgerAccountRepo {
  save(account: ILedgerAccount, options: IRepoOptions): Promise<void>;

  findById(
    id: TEntityId,
    options: IRepoOptions
  ): Promise<ILedgerAccount | null>;

  findByCode(
    code: string,
    accountingEntityId: TEntityId,
    options: IRepoOptions
  ): Promise<ILedgerAccount | null>;
}
