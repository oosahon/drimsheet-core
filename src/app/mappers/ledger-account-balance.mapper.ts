import { InferSelectModel } from 'drizzle-orm';
import { ILedgerAccountBalance } from '../../domain/accounting/types/ledger-account-balance.types';
import { ledgerAccountBalancesInCore } from '../../infra/config/drizzle/schema';
import { toRepoDate } from './date';
import moneyMapper from './money.mapper';

interface ILedgerAccountBalanceModel extends InferSelectModel<
  typeof ledgerAccountBalancesInCore
> {}

const ledgerAccountBalanceMapper = {
  toRepo(payload: ILedgerAccountBalance): ILedgerAccountBalanceModel {
    const { amount, currencyCode } = moneyMapper.toDto(payload.amount);
    const { amount: functionalAmount, currencyCode: functionalCurrencyCode } =
      moneyMapper.toDto(payload.functionalAmount);

    return {
      ledgerAccountId: payload.ledgerAccountId,
      accountingEntityId: payload.accountingEntityId,
      accountMaterializedPath: payload.accountMaterializedPath,
      amount,
      currencyCode,
      functionalAmount,
      functionalCurrencyCode,
      version: payload.version,
      createdAt: toRepoDate(payload.createdAt),
      updatedAt: toRepoDate(payload.updatedAt),
    };
  },
};

export default ledgerAccountBalanceMapper;
