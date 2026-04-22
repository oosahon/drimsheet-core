import categoryEntity from '../../../domain/category/entities/category.entity';
import {
  ELedgerType,
  ILedgerAccount,
} from '../../../domain/ledger/types/ledger.types';
import ILogger from '../../contracts/infra/logger.contract';

export default function makeMapCategoryToAccountUseCase(logger: ILogger) {
  return async (account: ILedgerAccount) => {
    if (account.isControlAccount) {
      logger.warn(
        `Skipping category mapping for control account ${account.id} with type ${account.type}`
      );
      return;
    }

    const mappableAccounts: string[] = [
      ELedgerType.Expense,
      ELedgerType.Liability,
      ELedgerType.Revenue,
    ];
    const isMappable = mappableAccounts.includes(account.type);

    if (!isMappable) {
      logger.warn(
        `Skipping category mapping for account ${account.id} with type ${account.type}`
      );
      return;
    }

    const [category, events] = categoryEntity.make({
      name: account.name,
      displayName: account.name,
      key: account.code,
      accountingEntityId: account.accountingEntityId,
      accountId: account.id,
      isGrouping: false,
    });

    // TODO: save to repo
  };
}
