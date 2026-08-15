import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';

import payablesMetaValue from '@domain/ledger/values/payables-meta.vo.';

describe('payablesMetaValue', () => {
  it('returns null statutory metadata unchanged', () => {
    expect(payablesMetaValue.makeStatutoryMeta(null)).toBeNull();
  });

  it('rejects invalid statutory metadata', () => {
    expect(() =>
      payablesMetaValue.makeStatutoryMeta({
        taxAuthority: 'A',
        taxType: 'VAT',
      })
    ).toThrow('ledger_error_ledger_account_tax_authority_invalid');
    expect(() =>
      payablesMetaValue.makeStatutoryMeta({
        taxAuthority: 'A'.repeat(101),
        taxType: 'VAT',
      })
    ).toThrow('ledger_error_ledger_account_tax_authority_invalid');
    expect(() =>
      payablesMetaValue.makeStatutoryMeta({
        taxAuthority: 'FIRS',
        taxType: 'A',
      })
    ).toThrow('ledger_error_ledger_account_tax_type_invalid');
  });

  it('returns null trade metadata unchanged', () => {
    expect(payablesMetaValue.makeTradeMeta(null)).toBeNull();
  });

  it('rejects invalid trade metadata identifiers', () => {
    expect(() =>
      payablesMetaValue.makeTradeMeta({
        counterpartyId: 'invalid' as TEntityId,
        invoiceId: generateUUID(),
      })
    ).toThrow('ledger_error_ledger_account_counterparty_id_invalid');
    expect(() =>
      payablesMetaValue.makeTradeMeta({
        counterpartyId: generateUUID(),
        invoiceId: 'invalid' as TEntityId,
      })
    ).toThrow('ledger_error_ledger_account_invoice_id_invalid');
  });

  it('returns immutable valid metadata', () => {
    const statutoryMeta = payablesMetaValue.makeStatutoryMeta({
      taxAuthority: 'FIRS',
      taxType: 'VAT',
    });
    const tradeMeta = payablesMetaValue.makeTradeMeta({
      counterpartyId: generateUUID(),
      invoiceId: generateUUID(),
    });

    expect(Object.isFrozen(statutoryMeta)).toBe(true);
    expect(Object.isFrozen(tradeMeta)).toBe(true);
  });
});
