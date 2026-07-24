import { ULedgerAccountSortBy } from '../../../../domain/ledger/shared/repos/ledger-account.repo';
import { ULedgerAccountBehavior } from '../../../../domain/ledger/shared/types/account-behaviors.tyypes';
import { ULedgerAccountSubType } from '../../../../domain/ledger/shared/types/ledger-aggregate.types';
import {
  UAdjunctAccountRule,
  UContraAccountRule,
  ULedgerAccountStatus,
  ULedgerType,
  UNormalBalance,
} from '../../../../domain/ledger/shared/types/ledger.types';
import { IPaginationDto } from '../../../../shared/pagination/dto/pagination.dto';
import { TEntityId } from '../../../../shared/types/uuid';
import { IMoneyDto } from '../../../money/dtos/money/money.dto';
export interface IGetLedgerAccountsQuery extends IPaginationDto {
  type?: ULedgerType;
  subType?: ULedgerAccountSubType;
  behavior?: string;
  isControlAccount?: boolean;
  orderBy?: ULedgerAccountSortBy;
}

export interface ILedgerAccountDto {
  id: TEntityId;
  code: string;
  materializedPath: string;
  accountingEntityId: TEntityId;
  type: ULedgerType;
  normalBalance: UNormalBalance;
  subType: any;
  behavior: ULedgerAccountBehavior;
  isControlAccount: boolean;
  controlAccountId?: TEntityId;
  name: string;
  status: ULedgerAccountStatus;
  contraAccountRule: UContraAccountRule;
  adjunctAccountRule: UAdjunctAccountRule;
  meta?: Record<string, string>; // TODO: replace with actual metadata when its decided
  openingBalanceDate: Date | null;
  createdBy: TEntityId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  balance: IMoneyDto;
  functionalBalance: IMoneyDto;
}
