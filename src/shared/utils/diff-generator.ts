import { IDiff } from '../types/diff.types';

function isObject(val: unknown): val is Record<string, unknown> {
  return (
    val !== null &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    !(val instanceof Date)
  );
}

type TDiffNodeResult = {
  bDiff: unknown;
  aDiff: unknown;
  hasChanges: boolean;
};

function deepDiff(afterNode: unknown, beforeNode: unknown): TDiffNodeResult {
  if (beforeNode === afterNode) {
    return { bDiff: undefined, aDiff: undefined, hasChanges: false };
  }

  if (beforeNode instanceof Date && afterNode instanceof Date) {
    if (beforeNode.getTime() === afterNode.getTime()) {
      return { bDiff: undefined, aDiff: undefined, hasChanges: false };
    }
    return { bDiff: beforeNode, aDiff: afterNode, hasChanges: true };
  }

  if (Array.isArray(beforeNode) && Array.isArray(afterNode)) {
    const maxLen = Math.max(beforeNode.length, afterNode.length);

    let hasChanges = false;
    const bDiffArr: unknown[] = [];
    const aDiffArr: unknown[] = [];

    for (let i = 0; i < maxLen; i++) {
      const {
        bDiff,
        aDiff,
        hasChanges: itemHasChanges,
      } = deepDiff(afterNode[i], beforeNode[i]);
      if (itemHasChanges) {
        hasChanges = true;
        bDiffArr[i] = bDiff;
        aDiffArr[i] = aDiff;
      } else {
        bDiffArr[i] = undefined;
        aDiffArr[i] = undefined;
      }
    }

    if (!hasChanges) {
      return { bDiff: undefined, aDiff: undefined, hasChanges: false };
    }
    return { bDiff: bDiffArr, aDiff: aDiffArr, hasChanges: true };
  }

  if (isObject(beforeNode) && isObject(afterNode)) {
    const keys = Array.from(
      new Set([...Object.keys(beforeNode), ...Object.keys(afterNode)])
    );

    const bDiffObj: Record<string, unknown> = {};
    const aDiffObj: Record<string, unknown> = {};
    let hasChanges = false;

    keys.forEach((k) => {
      const {
        bDiff,
        aDiff,
        hasChanges: itemHasChanges,
      } = deepDiff(afterNode[k], beforeNode[k]);
      if (itemHasChanges) {
        hasChanges = true;
        if (k in beforeNode) bDiffObj[k] = bDiff;
        else bDiffObj[k] = undefined;

        if (k in afterNode) aDiffObj[k] = aDiff;
        else aDiffObj[k] = undefined;
      }
    });

    if (!hasChanges) {
      return { bDiff: undefined, aDiff: undefined, hasChanges: false };
    }
    return { bDiff: bDiffObj, aDiff: aDiffObj, hasChanges: true };
  }

  return { bDiff: beforeNode, aDiff: afterNode, hasChanges: true };
}

export default function generateDiff<T extends object>(
  after: T,
  before?: T | null
): IDiff<T> & { hasChanges: boolean } {
  if (!before) {
    return {
      before: {} as Partial<T>,
      after: after as Partial<T>,
      hasChanges: true,
    };
  }

  const { bDiff, aDiff, hasChanges } = deepDiff(after, before);

  return {
    before: (bDiff ?? {}) as Partial<T>,
    after: (aDiff ?? {}) as Partial<T>,
    hasChanges,
  };
}
