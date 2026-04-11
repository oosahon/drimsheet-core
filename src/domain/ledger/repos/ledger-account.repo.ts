import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TEntityId } from '../../../shared/types/uuid';
import { ILedgerAccount, ULedgerType } from '../types/ledger.types';

export default interface ILedgerAccountRepo {
  save(
    account: ILedgerAccount | ILedgerAccount[],
    options: IRepoOptions
  ): Promise<void>;

  findById(
    id: TEntityId,
    options: IRepoOptions
  ): Promise<ILedgerAccount | null>;

  findByCode(
    code: string,
    accountingEntityId: TEntityId,
    options: IRepoOptions
  ): Promise<ILedgerAccount | null>;

  findBySubType(
    accountingEntityId: TEntityId,
    type: ULedgerType,
    subType: string,
    options: IRepoOptions
  ): Promise<ILedgerAccount[]>;

  findByBehavior(
    accountingEntityId: TEntityId,
    behavior: string,
    options: IRepoOptions
  ): Promise<ILedgerAccount[]>;
}
