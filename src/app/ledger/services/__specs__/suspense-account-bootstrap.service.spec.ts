import { IReadRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import {
  EAccountingEntityType,
  IAccountingEntity,
} from '@domain/accounting/types/accounting-entity.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';

import { mockSuspenseAccountService } from '@app/ledger/contracts/__mocks__/ledger.domain.services.mock';
import makeSuspenseAccountBootstrapService from '@app/ledger/services/suspense-account-bootstrap.service';

const accountingEntity = {
  id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
  ownerId: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
  type: EAccountingEntityType.Individual,
  functionalCurrencyCode: SYSTEM_CURRENCIES.USD.code,
} as IAccountingEntity;
const repoOptions: IReadRepoOptions = { correlationId: 'test-correlation-id' };

function makeAuditedAccount(
  name: string
): TAuditedEntity<ILedgerAccount, ILedgerAccount, ILedgerAccount> {
  const account = {
    id: `${name}-id` as TEntityId,
    name,
  } as ILedgerAccount;
  const occurredAt = new Date('2026-01-01T00:00:00.000Z');

  return [
    account,
    [{ type: `${name}-created`, data: account, occurredAt, enrichedAt: null }],
    {
      entityId: account.id,
      action: 'created',
      diff: { before: null, after: account },
      occurredAt,
    },
  ];
}

describe('suspenseAccountBootstrapService', () => {
  const service = makeSuspenseAccountBootstrapService({
    suspenseAccountService: mockSuspenseAccountService,
  });
  const asset = makeAuditedAccount('Asset Suspense Account');
  const liability = makeAuditedAccount('Liability Suspense Account');

  beforeEach(() => {
    jest.clearAllMocks();
    mockSuspenseAccountService.createAssetSuspense.mockResolvedValue(
      asset as never
    );
    mockSuspenseAccountService.createLiabilitySuspense.mockResolvedValue(
      liability as never
    );
  });

  it('creates both suspense accounts with functional currency and preserves tuple order', async () => {
    const result = await service.bootstrap(accountingEntity, repoOptions);

    expect(mockSuspenseAccountService.createAssetSuspense).toHaveBeenCalledWith(
      {
        accountingEntityId: accountingEntity.id,
        currency: SYSTEM_CURRENCIES.USD,
        createdBy: accountingEntity.ownerId,
        name: 'Asset Suspense Account',
      },
      repoOptions
    );
    expect(
      mockSuspenseAccountService.createLiabilitySuspense
    ).toHaveBeenCalledWith(
      {
        accountingEntityId: accountingEntity.id,
        currency: SYSTEM_CURRENCIES.USD,
        createdBy: accountingEntity.ownerId,
        name: 'Liability Suspense Account',
      },
      repoOptions
    );
    expect(result.entries).toEqual([
      { account: asset[0], audit: asset[2] },
      { account: liability[0], audit: liability[2] },
    ]);
    expect(result.events).toEqual([...asset[1], ...liability[1]]);
  });

  it('rejects immediately when suspense creation fails', async () => {
    const domainFailure = new Error('suspense failed');
    mockSuspenseAccountService.createAssetSuspense.mockRejectedValueOnce(
      domainFailure
    );

    await expect(service.bootstrap(accountingEntity, repoOptions)).rejects.toBe(
      domainFailure
    );
    expect(
      mockSuspenseAccountService.createLiabilitySuspense
    ).not.toHaveBeenCalled();
  });
});
