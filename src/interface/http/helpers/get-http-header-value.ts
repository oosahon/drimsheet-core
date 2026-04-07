import { IncomingHttpHeaders } from 'http';

export default function getHttpHeaderValue(
  headerName: string,
  headers: IncomingHttpHeaders
) {
  const headerValue = headers[headerName];
  return Array.isArray(headerValue) ? headerValue[0] : headerValue;
}
