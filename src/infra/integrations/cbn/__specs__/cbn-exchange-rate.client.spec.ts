import axios from 'axios';

import {
  fetchCbnExchangeRates,
  getCbnRetryAfterMs,
  isRetryableCbnExchangeRateError,
} from '@infra/integrations/cbn/cbn-exchange-rate.client';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    isAxiosError: jest.fn(
      (error: unknown) =>
        typeof error === 'object' &&
        error !== null &&
        'isAxiosError' in error &&
        error.isAxiosError === true
    ),
  },
}));

interface ITestAxiosErrorOptions {
  code?: string;
  retryAfter?: string | string[];
  status?: number;
}

function makeAxiosError(options: ITestAxiosErrorOptions = {}): unknown {
  return {
    code: options.code,
    isAxiosError: true,
    ...(options.status
      ? {
          response: {
            headers: options.retryAfter
              ? { 'retry-after': options.retryAfter }
              : {},
            status: options.status,
          },
        }
      : {}),
  };
}

describe('CBN exchange-rate client', () => {
  const get = jest.mocked(axios.get);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches and validates the bounded bulk response', async () => {
    const signal = new AbortController().signal;
    const records = [
      {
        centralrate: '1500.25',
        currency: 'US DOLLAR',
        ratedate: '2026-06-04',
      },
    ];
    get.mockResolvedValue({ data: records });

    await expect(fetchCbnExchangeRates(signal)).resolves.toEqual(records);
    expect(get).toHaveBeenCalledWith(
      'https://www.cbn.gov.ng/api/GetAllExchangeRates?format=json',
      {
        headers: { Accept: 'application/json' },
        maxContentLength: 16 * 1024 * 1024,
        signal,
        timeout: 30_000,
      }
    );
  });

  it.each([
    ['an empty response', []],
    ['a malformed record', [{ currency: 'US DOLLAR', ratedate: '2026-06-04' }]],
    [
      'an invalid date',
      [
        {
          centralrate: '1500.25',
          currency: 'US DOLLAR',
          ratedate: '06/04/2026',
        },
      ],
    ],
    [
      'a non-positive central rate',
      [
        {
          centralrate: '0',
          currency: 'US DOLLAR',
          ratedate: '2026-06-04',
        },
      ],
    ],
    [
      'a non-numeric central rate',
      [
        {
          centralrate: 'not-a-rate',
          currency: 'US DOLLAR',
          ratedate: '2026-06-04',
        },
      ],
    ],
  ])('rejects %s without returning partial records', async (_name, data) => {
    get.mockResolvedValue({ data });

    await expect(
      fetchCbnExchangeRates(new AbortController().signal)
    ).rejects.toMatchObject({ name: 'ZodError' });
  });

  it.each([408, 425, 429, 500, 503])(
    'classifies HTTP %s as retryable',
    (status) => {
      expect(isRetryableCbnExchangeRateError(makeAxiosError({ status }))).toBe(
        true
      );
    }
  );

  it.each([
    'ECONNABORTED',
    'ECONNREFUSED',
    'ECONNRESET',
    'EAI_AGAIN',
    'ENETUNREACH',
    'ENOTFOUND',
    'ETIMEDOUT',
  ])('classifies network code %s as retryable', (code) => {
    expect(isRetryableCbnExchangeRateError(makeAxiosError({ code }))).toBe(
      true
    );
  });

  it('does not retry deterministic or unknown failures', () => {
    expect(
      isRetryableCbnExchangeRateError(makeAxiosError({ status: 400 }))
    ).toBe(false);
    expect(
      isRetryableCbnExchangeRateError(
        makeAxiosError({ code: 'ERR_BAD_OPTION' })
      )
    ).toBe(false);
    expect(isRetryableCbnExchangeRateError(new Error('schema failed'))).toBe(
      false
    );
  });

  it('parses and bounds Retry-After seconds', () => {
    expect(
      getCbnRetryAfterMs(makeAxiosError({ retryAfter: '2', status: 429 }))
    ).toBe(2_000);
    expect(
      getCbnRetryAfterMs(makeAxiosError({ retryAfter: ['90'], status: 429 }))
    ).toBe(30_000);
  });

  it('parses Retry-After dates relative to the supplied clock', () => {
    const nowMs = Date.parse('2026-06-04T12:00:00.000Z');

    expect(
      getCbnRetryAfterMs(
        makeAxiosError({
          retryAfter: 'Thu, 04 Jun 2026 12:00:05 GMT',
          status: 429,
        }),
        nowMs
      )
    ).toBe(5_000);
  });

  it('ignores absent, invalid, expired, and non-429 Retry-After values', () => {
    expect(getCbnRetryAfterMs(makeAxiosError({ status: 429 }))).toBeUndefined();
    expect(
      getCbnRetryAfterMs(makeAxiosError({ retryAfter: 'invalid', status: 429 }))
    ).toBeUndefined();
    expect(
      getCbnRetryAfterMs(makeAxiosError({ retryAfter: '0', status: 429 }))
    ).toBeUndefined();
    expect(
      getCbnRetryAfterMs(makeAxiosError({ retryAfter: '2', status: 500 }))
    ).toBeUndefined();
    expect(getCbnRetryAfterMs(new Error('not axios'))).toBeUndefined();
  });
});
