import _ from 'lodash';
import z from 'zod';
import ledgerAccountError from '../../../domain/ledger/errors/ledger-account.error';
import {
  ELedgerType,
  UAdjunctAccountRule,
  UContraAccountRule,
  ULedgerAccountStatus,
  ULedgerType,
  UNormalBalance,
} from '../../../domain/ledger/types/ledger.types';
import { TEntityId } from '../../../shared/types/uuid';
import appError from '../../errors/app.error';
import { IMoneyDto } from './money.dto';
import {
  IPaginationDto,
  paginationQueryValidationSchema,
} from './pagination.dto';

// =========== error keys start ===========
const invalidTypeKey = new ledgerAccountError.InvalidType().errorKey;
const defaultErrorKey = new appError.UnprocessableEntity([]).errorKey;
// =========== error keys end ===========

export const ledgerAccountTypeValidation = z.enum(
  Object.values(ELedgerType) as [ULedgerType, ...ULedgerType[]],
  invalidTypeKey
);

export const ledgerAccountOrderByValidationSchema = z.enum(
  ['accountName', 'createdAt', 'balance'],
  invalidTypeKey
);

export interface IGetLedgerAccountsQuery extends IPaginationDto {
  type?: ULedgerType;
  subType?: string;
  behavior?: string;
  isControlAccount?: boolean;
  orderBy: 'accountName' | 'createdAt' | 'balance';
}

export const getLedgerAccountQueryValidationSchema = z.object({
  ..._.omit(paginationQueryValidationSchema.shape, ['orderBy']),
  type: ledgerAccountTypeValidation.optional(),
  subType: z.string(defaultErrorKey).optional(),
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
  subType: string;
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
