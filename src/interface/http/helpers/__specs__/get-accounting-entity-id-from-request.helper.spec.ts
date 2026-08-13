import { Request } from 'express';

import appError from '@shared/values/errors/app.error';

import getAccountingEntityIdFromRequest from '@interface/http/helpers/get-accounting-entity-id-from-request.helper';

describe('getAccountingEntityIdFromRequest', () => {
  const validAccountingEntityId = '123e4567-e89b-12d3-a456-426614174000';

  it('returns undefined when the header is missing', () => {
    const req = { headers: {} } as Request;

    expect(getAccountingEntityIdFromRequest(req)).toBeUndefined();
  });

  it('returns a valid accounting entity ID', () => {
    const req = {
      headers: { 'x-accounting-entity-id': validAccountingEntityId },
    } as unknown as Request;

    expect(getAccountingEntityIdFromRequest(req)).toBe(validAccountingEntityId);
  });

  it('uses the first value when the header is an array', () => {
    const req = {
      headers: {
        'x-accounting-entity-id': [
          validAccountingEntityId,
          '123e4567-e89b-12d3-a456-426614174001',
        ],
      },
    } as unknown as Request;

    expect(getAccountingEntityIdFromRequest(req)).toBe(validAccountingEntityId);
  });

  it('throws BadRequest when the supplied ID is malformed', () => {
    const req = {
      headers: { 'x-accounting-entity-id': 'invalid-uuid' },
    } as unknown as Request;

    expect(() => getAccountingEntityIdFromRequest(req)).toThrow(
      appError.BadRequest
    );
  });
});
