import _ from 'lodash';
import { IDiff } from '../types/diff.types';

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
    hasChanges: !_.isEqual(after, before),
  };
}
