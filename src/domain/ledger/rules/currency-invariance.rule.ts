import ledgerAccountError from '@domain/ledger/errors/ledger-account.error';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';
import { ICurrency } from '@domain/money/types/currency.types';

interface ICurrencyInvarianceInput {
  controlAccount: Pick<
    ILedgerAccount,
    'id' | 'code' | 'isControlAccount' | 'controlAccountId' | 'currency'
  >;
  subAccountCurrency: ICurrency | null;
}

function validate({
  controlAccount,
  subAccountCurrency,
}: ICurrencyInvarianceInput) {
  const isHeaderControlAccount =
    controlAccount.isControlAccount && controlAccount.controlAccountId === null;

  if (isHeaderControlAccount) {
    return;
  }

  const controlAccountCurrencyCode = controlAccount.currency?.code ?? null;
  const subAccountCurrencyCode = subAccountCurrency?.code ?? null;

  if (controlAccountCurrencyCode === subAccountCurrencyCode) {
    return;
  }

  throw new ledgerAccountError.ControlAccountCurrencyMismatch({
    controlAccountId: controlAccount.id,
    controlAccountCode: controlAccount.code,
    controlAccountCurrencyCode,
    subAccountCurrencyCode,
  });
}

const ledgerAccountCurrencyInvarianceRule = Object.freeze({ validate });

export default ledgerAccountCurrencyInvarianceRule;
