import { Request } from 'express';

import getHttpHeaderValue, {
  getCorrelationId,
  getIdempotencyKey,
} from '@interface/http/helpers/get-http-header-value';

describe('get-http-header-value', () => {
  describe('getHttpHeaderValue', () => {
    it('should return the header value when it is a string', () => {
      const headers = { 'x-custom-header': 'value1' };
      const result = getHttpHeaderValue('x-custom-header', headers);
      expect(result).toBe('value1');
    });

    it('should return the first element when the header value is an array', () => {
      const headers = { 'x-custom-header': ['value1', 'value2'] };
      const result = getHttpHeaderValue('x-custom-header', headers);
      expect(result).toBe('value1');
    });

    it('should return undefined when the header is not present', () => {
      const headers = {};
      const result = getHttpHeaderValue('x-custom-header', headers);
      expect(result).toBeUndefined();
    });
  });

  describe('getCorrelationId', () => {
    it('should return x-correlation-id from headers if present', () => {
      const mockReq = {
        headers: { 'x-correlation-id': 'existing-uuid' },
      } as Partial<Request>;
      const result = getCorrelationId(mockReq as Request);
      expect(result).toBe('existing-uuid');
    });

    it('should generate a new UUID if x-correlation-id is not present', () => {
      const mockReq = { headers: {} } as Partial<Request>;
      const result = getCorrelationId(mockReq as Request);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getIdempotencyKey', () => {
    it('should return x-idempotency-key from headers if present', () => {
      const mockReq = {
        headers: { 'x-idempotency-key': 'idempotency-123' },
      } as Partial<Request>;
      const result = getIdempotencyKey(mockReq as Request);
      expect(result).toBe('idempotency-123');
    });

    it('should return undefined if x-idempotency-key is not present', () => {
      const mockReq = { headers: {} } as Partial<Request>;
      const result = getIdempotencyKey(mockReq as Request);
      expect(result).toBeUndefined();
    });
  });
});
