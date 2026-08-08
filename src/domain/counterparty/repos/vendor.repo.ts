import { IWriteRepoOptions } from '@shared/types/repo.types';

import { IVendorHistory } from '@domain/counterparty/types/counterparty-audit.types';
import { IVendor } from '@domain/counterparty/types/counterparty.types';

export default interface IVendorRepo {
  create(
    payload: IVendor,
    repoOptions: IWriteRepoOptions<IVendorHistory>
  ): Promise<void>;
}
