import { postgres } from '@infra/config/postgres.config';
import getDbQuery from '@infra/persistence/helpers/get-db-query';

describe('getDbQuery', () => {
  it('should return options.tx if provided', () => {
    const mockTx = { query: {} } as any;
    const result = getDbQuery({
      tx: mockTx,
      correlationId: 'test-correlation-id',
    });
    expect(result).toBe(mockTx);
  });

  it('should return postgres if options.tx is not provided or undefined', () => {
    const result = getDbQuery({ correlationId: 'test-correlation-id' });
    expect(result).toBe(postgres);
  });
});
