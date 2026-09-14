import ledgerAccountError from '@domain/ledger/errors/ledger-account.error';

export default function getNextSubledgerAccountCode<T extends string>(
  headerCode: string,
  predecessorCode: T
): T {
  if (!/^[1-5][0-9]{2}$/.test(headerCode)) {
    throw new ledgerAccountError.InvalidHeaderCode({ headerCode });
  }

  const code = predecessorCode.substring(3);
  const isInvalidPredecessorCode =
    !predecessorCode.startsWith(headerCode) || code.length !== 3;
  if (isInvalidPredecessorCode) {
    throw new ledgerAccountError.InvalidPredecessorCode({ predecessorCode });
  }

  if (code === '999') {
    throw new ledgerAccountError.MaximumLimitReached({ predecessorCode });
  }

  const nextCode = (Number(code) + 1).toString().padStart(3, '0');

  return `${headerCode}${nextCode}` as T;
}
