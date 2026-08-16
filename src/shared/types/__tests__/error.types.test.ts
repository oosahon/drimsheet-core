import {
  EErrorKeyStatusSuffix,
  TErrorKey,
  TErrorKeys,
} from '@shared/types/error.types';

const approvedKeys = {
  Invalid: 'test_error_invalid',
  Unauthorized: 'test_error_credential_unauthorized',
  PaymentRequired: 'test_error_subscription_payment_required',
  Forbidden: 'test_error_action_forbidden',
  NotFound: 'test_error_resource_not_found',
  Conflict: 'test_error_state_conflict',
  ValidationError: 'test_error_validation_error',
  TooManyRequests: 'test_error_too_many_requests',
  Unexpected: 'test_error_dependency_unexpected',
} as const satisfies TErrorKeys<'test_error'>;

const brandedKey: TErrorKey<'test_error'> = 'test_error_value_invalid';

const missingSuffix = {
  // @ts-expect-error terminal status suffix is required
  Invalid: 'test_error_value',
} as const satisfies TErrorKeys<'test_error'>;

const retiredSuffix = {
  // @ts-expect-error internal_server_error is not an approved suffix
  Unexpected: 'test_error_internal_server_error',
} as const satisfies TErrorKeys<'test_error'>;

const unsupportedSuffix = {
  // @ts-expect-error unavailable is not an approved suffix
  Unavailable: 'test_error_dependency_unavailable',
} as const satisfies TErrorKeys<'test_error'>;

const wrongContext = {
  // @ts-expect-error the declared context must prefix every key
  Invalid: 'other_error_value_invalid',
} as const satisfies TErrorKeys<'test_error'>;

describe('error-key types', () => {
  it('preserves every approved suffix and the declared context', () => {
    expect(Object.values(approvedKeys)).toHaveLength(
      Object.keys(EErrorKeyStatusSuffix).length
    );
    expect(brandedKey).toBe('test_error_value_invalid');
    expect(missingSuffix.Invalid).toBe('test_error_value');
    expect(retiredSuffix.Unexpected).toBe('test_error_internal_server_error');
    expect(unsupportedSuffix.Unavailable).toBe(
      'test_error_dependency_unavailable'
    );
    expect(wrongContext.Invalid).toBe('other_error_value_invalid');
  });
});
