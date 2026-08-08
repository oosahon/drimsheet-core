import { IncomingHttpHeaders } from 'http';

import { Request } from 'express';

import generateUUID from '@shared/utils/uuid-generator';

export default function getHttpHeaderValue(
  headerName: string,
  headers: IncomingHttpHeaders
) {
  const headerValue = headers[headerName];
  return Array.isArray(headerValue) ? headerValue[0] : headerValue;
}

export function getCorrelationId(req: Request) {
  return getHttpHeaderValue('x-correlation-id', req.headers) || generateUUID();
}

export function getIdempotencyKey(req: Request) {
  return getHttpHeaderValue('x-idempotency-key', req.headers);
}
