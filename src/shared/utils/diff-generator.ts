import { isEqual } from 'lodash';

import { IDiff } from '@shared/types/diff.types';

export default function generateDiff<T extends object>(
  after: T,
  before?: T | null
): IDiff<T> & { hasChanges: boolean } {
  if (before === undefined || before === null) {
    return {
      before: null,
      after,
      hasChanges: true,
    };
  }

  return {
    before,
    after,
    hasChanges: !isEqual(after, before),
  };
}
