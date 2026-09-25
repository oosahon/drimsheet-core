import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';

import ledgerAccountEntity from '@domain/ledger/entities/ledger-account.entity';
import ledgerAccountCurrencyInvarianceRule from '@domain/ledger/rules/currency-invariance.rule';
import {
  EAssetAccountBehavior,
  EAssetSubType,
} from '@domain/ledger/types/asset-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
  ILedgerAccount,
} from '@domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import { ICurrency } from '@domain/money/types/currency.types';

describe('ledgerAccountCurrencyInvarianceRule', () => {
  const makeControlAccount = (
    overrides: Partial<ILedgerAccount> = {}
  ): Readonly<ILedgerAccount> =>
    ledgerAccountEntity.make<ILedgerAccount>({
      name: 'Control Account',
      code: '100000',
      materializedPath: '100000',
      accountingEntityId: generateUUID(),
      normalBalance: ENormalBalance.Debit,
      type: ELedgerType.Asset,
      subType: EAssetSubType.CashAndCashEquivalent,
      behavior: EAssetAccountBehavior.DefaultCash,
      isControlAccount: true,
      controlAccountId: null,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
      createdBy: generateUUID(),
      ...overrides,
    })[0];

  it.each([
    {
      label: 'equal fixed currencies',
      controlAccountCurrency: SYSTEM_CURRENCIES.USD,
      subAccountCurrency: SYSTEM_CURRENCIES.USD,
    },
    {
      label: 'different fixed currencies',
      controlAccountCurrency: SYSTEM_CURRENCIES.USD,
      subAccountCurrency: SYSTEM_CURRENCIES.EUR,
    },
    {
      label: 'fixed-to-null currencies',
      controlAccountCurrency: SYSTEM_CURRENCIES.USD,
      subAccountCurrency: null,
    },
    {
      label: 'null-to-fixed currencies',
      controlAccountCurrency: null,
      subAccountCurrency: SYSTEM_CURRENCIES.USD,
    },
  ])(
    'permits $label under a header',
    ({ controlAccountCurrency, subAccountCurrency }) => {
      const controlAccount = makeControlAccount({
        currency: controlAccountCurrency,
      });

      expect(() =>
        ledgerAccountCurrencyInvarianceRule.validate({
          controlAccount,
          subAccountCurrency,
        })
      ).not.toThrow();
    }
  );

  it('permits matching fixed currency codes from different objects', () => {
    const equivalentUsdCurrency: ICurrency = {
      ...SYSTEM_CURRENCIES.USD,
    };
    const controlAccount = makeControlAccount({
      controlAccountId: generateUUID(),
    });

    expect(() =>
      ledgerAccountCurrencyInvarianceRule.validate({
        controlAccount,
        subAccountCurrency: equivalentUsdCurrency,
      })
    ).not.toThrow();
  });

  it('permits matching null currencies under a non-header control account', () => {
    const controlAccount = makeControlAccount({
      controlAccountId: generateUUID(),
      currency: null,
    });

    expect(() =>
      ledgerAccountCurrencyInvarianceRule.validate({
        controlAccount,
        subAccountCurrency: null,
      })
    ).not.toThrow();
  });

  it.each([
    {
      label: 'different fixed currencies',
      controlAccountCurrency: SYSTEM_CURRENCIES.USD,
      subAccountCurrency: SYSTEM_CURRENCIES.EUR,
    },
    {
      label: 'fixed-to-null currencies',
      controlAccountCurrency: SYSTEM_CURRENCIES.USD,
      subAccountCurrency: null,
    },
    {
      label: 'null-to-fixed currencies',
      controlAccountCurrency: null,
      subAccountCurrency: SYSTEM_CURRENCIES.USD,
    },
  ])(
    'rejects $label under a non-header control account',
    ({ controlAccountCurrency, subAccountCurrency }) => {
      const controlAccount = makeControlAccount({
        controlAccountId: generateUUID(),
        currency: controlAccountCurrency,
      });

      expect(() =>
        ledgerAccountCurrencyInvarianceRule.validate({
          controlAccount,
          subAccountCurrency,
        })
      ).toThrow(
        expect.objectContaining({
          errorKey:
            'ledger_error_ledger_account_control_account_currency_mismatch_invalid',
          cause: {
            controlAccountId: controlAccount.id,
            controlAccountCode: controlAccount.code,
            controlAccountCurrencyCode: controlAccountCurrency?.code ?? null,
            subAccountCurrencyCode: subAccountCurrency?.code ?? null,
          },
        })
      );
    }
  );

  it('does not exempt a root posting account', () => {
    const controlAccount = makeControlAccount({
      isControlAccount: false,
      controlAccountId: null,
    });

    expect(() =>
      ledgerAccountCurrencyInvarianceRule.validate({
        controlAccount,
        subAccountCurrency: SYSTEM_CURRENCIES.EUR,
      })
    ).toThrow(
      expect.objectContaining({
        errorKey:
          'ledger_error_ledger_account_control_account_currency_mismatch_invalid',
      })
    );
  });
});
