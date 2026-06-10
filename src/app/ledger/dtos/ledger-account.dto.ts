import _ from 'lodash';
import z from 'zod';
import ledgerAccountError from '../../../domain/ledger/errors/ledger-account.error';
import {
  ELedgerAccountSortBy,
  ULedgerAccountSortBy,
} from '../../../domain/ledger/repos/ledger-account.repo';
import {
  ELedgerAccountSubType,
  ULedgerAccountSubType,
} from '../../../domain/ledger/types/ledger-aggregate.types';
import {
  ELedgerType,
  UAdjunctAccountRule,
  UContraAccountRule,
  ULedgerAccountStatus,
  ULedgerType,
  UNormalBalance,
} from '../../../domain/ledger/types/ledger.types';
import { TEntityId } from '../../../shared/types/uuid';
import { IMoneyDto } from '../../shared/dtos/money.dto';
import {
  IPaginationDto,
  paginationQueryValidationSchema,
} from '../../shared/dtos/pagination.dto';
import appError from '../../shared/errors/app.error';

// =========== error keys start ===========
const invalidTypeKey = new ledgerAccountError.InvalidType().errorKey;
const invalidSubTypeKey = new ledgerAccountError.InvalidSubType().errorKey;
const defaultErrorKey = new appError.UnprocessableEntity([]).errorKey;
// =========== error keys end ===========

export const ledgerAccountTypeValidation = z.enum(
  Object.values(ELedgerType) as [ULedgerType, ...ULedgerType[]],
  invalidTypeKey
);

export const ledgerAccountOrderByValidationSchema = z.enum(
  Object.values(ELedgerAccountSortBy) as [
    ULedgerAccountSortBy,
    ...ULedgerAccountSortBy[],
  ],
  { message: invalidTypeKey }
);

export const ledgerAccountSubTypeValidation = z.enum(
  Object.values(ELedgerAccountSubType) as [
    ULedgerAccountSubType,
    ...ULedgerAccountSubType[],
  ],
  { message: invalidSubTypeKey }
);
export interface IGetLedgerAccountsQuery extends IPaginationDto {
  type?: ULedgerType;
  subType?: ULedgerAccountSubType;
  behavior?: string;
  isControlAccount?: boolean;
  orderBy?: ULedgerAccountSortBy;
}

export const getLedgerAccountQueryValidationSchema = z.object({
  ..._.omit(paginationQueryValidationSchema.shape, ['orderBy']),
  type: ledgerAccountTypeValidation.optional(),
  subType: ledgerAccountSubTypeValidation.optional(),
  behavior: z.string(defaultErrorKey).optional(),
  isControlAccount: z.boolean(defaultErrorKey).optional(),
  orderBy: ledgerAccountOrderByValidationSchema.optional(),
});

export interface ILedgerAccountDto {
  id: TEntityId;
  code: string;
  materializedPath: string;
  accountingEntityId: TEntityId;
  type: ULedgerType;
  normalBalance: UNormalBalance;
  subType: any;
  behavior: string;
  isControlAccount: boolean;
  controlAccountId?: TEntityId;
  name: string;
  status: ULedgerAccountStatus;
  contraAccountRule: UContraAccountRule;
  adjunctAccountRule: UAdjunctAccountRule;
  meta?: Record<string, string>; // TODO: replace with actual metadata when its decided
  createdBy: TEntityId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  balance: IMoneyDto;
  functionalBalance: IMoneyDto;
}
