import { InferSelectModel } from 'drizzle-orm';
import { IBankValue } from '../../../../domain/ledger/asset-account/types/asset-account.types';
import bankAccountValue from '../../../../domain/ledger/asset-account/values/bank-account.vo';
import { TEntityId } from '../../../../shared/types/uuid';
import { bankAccountsInCore } from '../../../config/drizzle/schema';

export interface IBankAccountModel extends InferSelectModel<
  typeof bankAccountsInCore
> {}

const bankAccountMapper = {
  toRepo(
    ledgerAccountId: TEntityId,
    accountingEntityId: TEntityId,
    value: IBankValue
  ): IBankAccountModel {
    return {
      bankName: value.bankName,
      accountNumber: value.accountNumber,
      accountName: value.accountName,
      countryCode: value.countryCode,
      accountingEntityId,
      ledgerAccountId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  toDomain(record: IBankAccountModel): IBankValue {
    return bankAccountValue.make({
      countryCode: record.countryCode,
      bankName: record.bankName,
      accountName: record.accountName,
      accountNumber: record.accountNumber,
    });
  },
};

export default bankAccountMapper;
