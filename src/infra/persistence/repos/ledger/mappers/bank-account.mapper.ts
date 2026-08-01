import { InferSelectModel } from 'drizzle-orm';
import { IBankDetails } from '../../../../../domain/ledger/asset-account/types/asset-account.types';
import bankDetailsValue from '../../../../../domain/ledger/asset-account/values/bank-details.vo';
import { TEntityId } from '../../../../../shared/types/uuid';
import { bankDetailsInCore } from '../../../../config/drizzle/schema';

export interface IBankAccountModel extends InferSelectModel<
  typeof bankDetailsInCore
> {}

const bankAccountMapper = {
  toRepo(
    ledgerAccountId: TEntityId,
    accountingEntityId: TEntityId,
    value: IBankDetails
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

  toDomain(record: IBankAccountModel): IBankDetails {
    return bankDetailsValue.make({
      countryCode: record.countryCode,
      bankName: record.bankName,
      accountName: record.accountName,
      accountNumber: record.accountNumber,
    });
  },
};

export default bankAccountMapper;
