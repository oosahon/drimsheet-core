import { TEntityId } from '@shared/types/uuid';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import { ILedgerAccount } from '@domain/ledger/types/ledger.types';
import { ISuspenseAccountService } from '@domain/ledger/types/suspense-account.service.types';
import currencyEntity from '@domain/money/entities/currency.entity';

import { ILedgerAccountBootstrapResult } from '@app/ledger/contracts/ledger-account-bootstrap.types';
import ISuspenseAccountBootstrapService from '@app/ledger/contracts/suspense-account-bootstrap.service.contract';

interface IDependencies {
  suspenseAccountService: ISuspenseAccountService;
}

type TAuditedLedgerAccount = TAuditedEntity<
  ILedgerAccount,
  ILedgerAccount,
  ILedgerAccount
>;

function appendAccount(
  bootstrap: ILedgerAccountBootstrapResult,
  [account, events, audit]: TAuditedLedgerAccount
) {
  bootstrap.entries.push({ account, audit });
  bootstrap.events.push(...events);
}

export default function makeSuspenseAccountBootstrapService(
  deps: IDependencies
): ISuspenseAccountBootstrapService {
  const bootstrap: ISuspenseAccountBootstrapService['bootstrap'] = async (
    accountingEntity,
    createdBy,
    repoOptions
  ) => {
    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );
    const payload = {
      accountingEntityId: accountingEntity.id,
      currency: functionalCurrency,
      createdBy: createdBy,
    };
    const bootstrapResult: ILedgerAccountBootstrapResult = {
      entries: [],
      events: [],
    };

    // ========================================================================
    // ASSET LEDGER SUSPENSE ACCOUNT
    // ========================================================================

    appendAccount(
      bootstrapResult,
      await deps.suspenseAccountService.createAssetSuspense(
        { ...payload, name: 'Asset Suspense Account' },
        repoOptions
      )
    );

    // ========================================================================
    // LIABILITY LEDGER SUSPENSE ACCOUNT
    // ========================================================================

    appendAccount(
      bootstrapResult,
      await deps.suspenseAccountService.createLiabilitySuspense(
        { ...payload, name: 'Liability Suspense Account' },
        repoOptions
      )
    );

    return Object.freeze(bootstrapResult);
  };

  return Object.freeze({ bootstrap });
}
