import mockRepoService from '@shared/contracts/__mocks__/repo.mock';
import { ITransactionContext } from '@shared/types/repo.types';

import exchangeRateError from '@domain/money/errors/exchange-rate.error';
import {
  EExchangeRateType,
  IExchangeRate,
} from '@domain/money/types/exchange-rate.types';
import actorEntity from '@domain/user/entities/actor.entity';

import { mockExchangeRateRepo } from '@app/money/contracts/__mocks__/money.repos.mock';
import {
  IExchangeRateDto,
  IExchangeRateIngestionDto,
} from '@app/money/dtos/exchange-rate/exchange-rate.dto';
import makeIngestExchangeRateUseCase from '@app/money/usecases/ingest-exchange-rate.usecase';
import { mockActorService } from '@app/user/contracts/__mocks__/actor.services.mock';

describe('makeIngestExchangeRateUseCase', () => {
  const [systemActor] = actorEntity.makeSystem(
    actorEntity.makeMigration()[0].id
  );
  const correlationId = '019cde0f-5b78-775a-bf29-8f02a947760a';

  const makeExchangeRate = (
    overrides: Partial<IExchangeRateDto> = {}
  ): IExchangeRateDto => ({
    baseCurrencyCode: 'USD',
    targetCurrencyCode: 'NGN',
    rate: 1500.25,
    type: EExchangeRateType.Official,
    asOf: new Date('2026-06-10T00:00:00.000Z'),
    source: 'CBN',
    ...overrides,
  });

  const makePayload = (
    exchangeRates: IExchangeRateDto[]
  ): IExchangeRateIngestionDto => ({ correlationId, exchangeRates });

  const makeLatestExchangeRate = (
    baseCurrencyCode: string,
    asOf: Date
  ): IExchangeRate => ({
    currencyPair: `${baseCurrencyCode}/NGN`,
    baseCurrencyCode,
    targetCurrencyCode: 'NGN',
    rate: 1500.25,
    type: EExchangeRateType.Official,
    asOf,
    source: 'CBN',
    createdAt: new Date('2026-06-11T00:00:00.000Z'),
  });

  const makeUseCase = () =>
    makeIngestExchangeRateUseCase({
      actorService: mockActorService,
      exchangeRateRepo: mockExchangeRateRepo,
      repoService: mockRepoService,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockActorService.resolveByUsername
      .mockReset()
      .mockResolvedValue(systemActor);
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-11T12:00:00.000Z'));
    mockExchangeRateRepo.create.mockResolvedValue(undefined);
    mockExchangeRateRepo.findLatest.mockResolvedValue([]);
    mockRepoService.runInTransaction.mockImplementation(async (callback) =>
      callback('mock-tx' as unknown as ITransactionContext)
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('filters before batching and persists selected rates in one transaction', async () => {
    const exchangeRates = Array.from({ length: 151 }, (_, index) =>
      makeExchangeRate({
        asOf: new Date(
          index === 0 ? '2026-06-09T00:00:00.000Z' : '2026-06-10T00:00:00.000Z'
        ),
        rate: 1500 + index,
      })
    );
    mockExchangeRateRepo.findLatest.mockResolvedValue([
      makeLatestExchangeRate('USD', new Date('2026-06-10T00:00:00.000Z')),
    ]);

    await expect(makeUseCase()(makePayload(exchangeRates))).resolves.toEqual({
      processedCount: 150,
    });

    expect(mockExchangeRateRepo.findLatest).toHaveBeenCalledWith(['USD/NGN'], {
      correlationId,
    });
    expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);
    expect(mockExchangeRateRepo.create).toHaveBeenCalledTimes(2);
    expect(mockExchangeRateRepo.create.mock.calls[0][0]).toHaveLength(100);
    expect(mockExchangeRateRepo.create.mock.calls[1][0]).toHaveLength(50);
    expect(mockExchangeRateRepo.create).toHaveBeenNthCalledWith(
      1,
      expect.arrayContaining([
        expect.objectContaining({
          baseCurrencyCode: 'USD',
          currencyPair: 'USD/NGN',
          source: 'CBN',
          targetCurrencyCode: 'NGN',
          type: 'official',
        }),
      ]),
      systemActor.id,
      { correlationId, tx: 'mock-tx' }
    );
    expect(
      mockExchangeRateRepo.create.mock.calls
        .flatMap(([batch]) => batch)
        .some(
          (exchangeRate) =>
            exchangeRate.asOf.getTime() ===
            new Date('2026-06-09T00:00:00.000Z').getTime()
        )
    ).toBe(false);
  });

  it('returns a zero count without reading or opening a transaction for empty input', async () => {
    await expect(makeUseCase()(makePayload([]))).resolves.toEqual({
      processedCount: 0,
    });

    expect(mockExchangeRateRepo.findLatest).not.toHaveBeenCalled();
    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    expect(mockExchangeRateRepo.create).not.toHaveBeenCalled();
  });

  it('reads unique pair checkpoints once and retains all rates for an absent pair', async () => {
    const exchangeRates = [
      makeExchangeRate({ asOf: new Date('2026-06-09T00:00:00.000Z') }),
      makeExchangeRate({ asOf: new Date('2026-06-10T00:00:00.000Z') }),
      makeExchangeRate({
        asOf: new Date('2024-01-01T00:00:00.000Z'),
        baseCurrencyCode: 'EUR',
      }),
    ];
    mockExchangeRateRepo.findLatest.mockResolvedValue([
      makeLatestExchangeRate('USD', new Date('2026-06-10T00:00:00.000Z')),
    ]);

    await expect(makeUseCase()(makePayload(exchangeRates))).resolves.toEqual({
      processedCount: 2,
    });

    expect(mockExchangeRateRepo.findLatest).toHaveBeenCalledTimes(1);
    expect(mockExchangeRateRepo.findLatest).toHaveBeenCalledWith(
      ['USD/NGN', 'EUR/NGN'],
      { correlationId }
    );
    expect(mockExchangeRateRepo.create).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          asOf: new Date('2026-06-10T00:00:00.000Z'),
          currencyPair: 'USD/NGN',
        }),
        expect.objectContaining({
          asOf: new Date('2024-01-01T00:00:00.000Z'),
          currencyPair: 'EUR/NGN',
        }),
      ]),
      systemActor.id,
      { correlationId, tx: 'mock-tx' }
    );
  });

  it('applies independent inclusive checkpoints to each currency pair', async () => {
    const exchangeRates = [
      makeExchangeRate({ asOf: new Date('2026-06-09T00:00:00.000Z') }),
      makeExchangeRate({ asOf: new Date('2026-06-10T00:00:00.000Z') }),
      makeExchangeRate({
        asOf: new Date('2026-06-08T00:00:00.000Z'),
        baseCurrencyCode: 'EUR',
      }),
      makeExchangeRate({
        asOf: new Date('2026-06-09T00:00:00.000Z'),
        baseCurrencyCode: 'EUR',
      }),
    ];
    mockExchangeRateRepo.findLatest.mockResolvedValue([
      makeLatestExchangeRate('USD', new Date('2026-06-10T00:00:00.000Z')),
      makeLatestExchangeRate('EUR', new Date('2026-06-09T00:00:00.000Z')),
    ]);

    await expect(makeUseCase()(makePayload(exchangeRates))).resolves.toEqual({
      processedCount: 2,
    });

    const persistedRates = mockExchangeRateRepo.create.mock.calls.flatMap(
      ([batch]) => batch
    );
    expect(persistedRates).toEqual([
      expect.objectContaining({
        asOf: new Date('2026-06-10T00:00:00.000Z'),
        currencyPair: 'USD/NGN',
      }),
      expect.objectContaining({
        asOf: new Date('2026-06-09T00:00:00.000Z'),
        currencyPair: 'EUR/NGN',
      }),
    ]);
  });

  it('does not open a transaction when every rate predates its checkpoint', async () => {
    mockExchangeRateRepo.findLatest.mockResolvedValue([
      makeLatestExchangeRate('USD', new Date('2026-06-11T00:00:00.000Z')),
    ]);

    await expect(
      makeUseCase()(
        makePayload([
          makeExchangeRate({ asOf: new Date('2026-06-10T00:00:00.000Z') }),
        ])
      )
    ).resolves.toEqual({ processedCount: 0 });

    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    expect(mockExchangeRateRepo.create).not.toHaveBeenCalled();
  });

  it('rejects malformed DTO input before opening a transaction', async () => {
    const payload = makePayload([makeExchangeRate({ rate: 0 })]);

    await expect(makeUseCase()(payload)).rejects.toMatchObject({
      name: 'UnprocessableEntity',
    });

    expect(mockExchangeRateRepo.findLatest).not.toHaveBeenCalled();
    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
  });

  it('propagates domain validation failures before opening a transaction', async () => {
    const payload = makePayload([
      makeExchangeRate({ asOf: new Date('2026-06-12T00:00:00.000Z') }),
    ]);

    await expect(makeUseCase()(payload)).rejects.toThrow(
      exchangeRateError.InvalidDate
    );

    expect(mockExchangeRateRepo.findLatest).not.toHaveBeenCalled();
    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
  });

  it('propagates checkpoint read failures before opening a transaction', async () => {
    const repositoryError = new Error('Database read failed');
    mockExchangeRateRepo.findLatest.mockRejectedValue(repositoryError);

    await expect(makeUseCase()(makePayload([makeExchangeRate()]))).rejects.toBe(
      repositoryError
    );

    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
    expect(mockExchangeRateRepo.create).not.toHaveBeenCalled();
  });

  it('propagates repository failures from the transaction', async () => {
    const repositoryError = new Error('Database save failed');
    mockExchangeRateRepo.create.mockRejectedValue(repositoryError);

    await expect(makeUseCase()(makePayload([makeExchangeRate()]))).rejects.toBe(
      repositoryError
    );
  });

  it('propagates transaction failures', async () => {
    const transactionError = new Error('Transaction failed');
    mockRepoService.runInTransaction.mockRejectedValue(transactionError);

    await expect(makeUseCase()(makePayload([makeExchangeRate()]))).rejects.toBe(
      transactionError
    );
  });

  it('remains safe when repeated conflict writes are accepted as no-ops', async () => {
    const useCase = makeUseCase();
    const payload = makePayload([makeExchangeRate()]);

    await expect(useCase(payload)).resolves.toEqual({ processedCount: 1 });
    await expect(useCase(payload)).resolves.toEqual({ processedCount: 1 });

    expect(mockExchangeRateRepo.create).toHaveBeenCalledTimes(2);
  });
});
