import { ILedgerAccount } from '../../../domain/ledger/shared/types/ledger.types';
import { IMoney } from '../../../shared/types/money.types';
import moneyMapper from '../../shared/mappers/money.mapper';
import { ILedgerAccountDto } from '../dtos/ledger-account.dto';

const ledgerAccountMapper = {
  toDto(
    payload: ILedgerAccount,
    balance: IMoney,
    functionalBalance: IMoney
  ): ILedgerAccountDto {
    return {
      id: payload.id,
      code: payload.code,
      materializedPath: payload.materializedPath,
      accountingEntityId: payload.accountingEntityId,
      type: payload.type,
      normalBalance: payload.normalBalance,
      subType: payload.subType,
      behavior: payload.behavior,
      isControlAccount: payload.isControlAccount,
      controlAccountId: payload.controlAccountId ?? undefined,
      name: payload.name,
      status: payload.status,
      contraAccountRule: payload.contraAccountRule,
      adjunctAccountRule: payload.adjunctAccountRule,
      meta: undefined, // TODO: replace with actual metadata when its decided
      createdBy: payload.createdBy,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
      deletedAt: payload.deletedAt ?? undefined,
      balance: moneyMapper.toDto(balance),
      functionalBalance: moneyMapper.toDto(functionalBalance),
    };
  },
};

export default ledgerAccountMapper;
