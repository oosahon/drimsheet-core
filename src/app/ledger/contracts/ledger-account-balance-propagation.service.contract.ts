import { IReadRepoOptions } from '@shared/types/repo.types';

import { IJournalEntry } from '@domain/journal-entry/types/journal-entry.types';

export interface ILedgerAccountBalancePropagationService {
  /**
   * Best-effort propagation. Failures are reported by the service and do not
   * reject the caller's completed journal-entry workflow.
   */
  propagate(
    journalEntry: IJournalEntry,
    repoOptions: IReadRepoOptions
  ): Promise<void>;
}
