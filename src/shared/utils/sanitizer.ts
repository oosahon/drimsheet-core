export const SENSITIVE_KEYS = new Set([
  'token',
  'access_token',
  'accesstoken',
  'refresh_token',
  'refreshtoken',
  'id_token',
  'idtoken',
  'secret',
  'client_secret',
  'clientsecret',
  'password',
  'pass',
  'pwd',
  'code',
  'state',
  'authorization',
  'auth',
  'cookie',
  'set-cookie',
  'credit_card',
  'creditcard',
  'card_number',
  'cardnumber',
  'cvv',
  'cvc',
  'api_key',
  'apikey',
  'private_key',
  'privatekey',
  'secret_key',
  'secretkey',
]);

const SENSITIVE_TEXT_REGEX =
  /(token|secret|password|authorization|access_token|refresh_token|api_key|client_secret)([:=]\s*)([^\s,;]+)/gi;

function sanitizeString(str: string): string {
  if (!str || typeof str !== 'string') {
    return str;
  }

  if (str.includes('?')) {
    return str.replace(/([^\s?#]+)\?([^\s#]+)/g, (match, path, queryString) => {
      try {
        const params = new URLSearchParams(queryString);
        let modified = false;
        for (const key of Array.from(params.keys())) {
          if (SENSITIVE_KEYS.has(key.toLowerCase())) {
            params.set(key, '[REDACTED]');
            modified = true;
          }
        }
        return modified ? `${path}?${params.toString()}` : match;
      } catch {
        return match;
      }
    });
  }

  return str.replace(
    SENSITIVE_TEXT_REGEX,
    (match, key, sep) => `${key}${sep}[REDACTED]`
  );
}

export function sanitizeData(
  data: unknown,
  seen: WeakSet<object> = new WeakSet()
): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return sanitizeString(data);
  }

  if (typeof data !== 'object') {
    return data;
  }

  if (seen.has(data as object)) {
    return '[CIRCULAR]';
  }

  seen.add(data as object);

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item, seen));
  }

  if (data instanceof Date || data instanceof RegExp) {
    return data;
  }

  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
    return data;
  }

  if (data instanceof Error) {
    const errorCopy = Object.create(Object.getPrototypeOf(data));
    Object.defineProperty(errorCopy, 'name', {
      value: data.name,
      writable: true,
      configurable: true,
      enumerable: false,
    });
    Object.defineProperty(errorCopy, 'message', {
      value: sanitizeString(data.message),
      writable: true,
      configurable: true,
      enumerable: false,
    });
    if (data.stack) {
      Object.defineProperty(errorCopy, 'stack', {
        value: sanitizeString(data.stack),
        writable: true,
        configurable: true,
        enumerable: false,
      });
    }
    const propNames = Object.getOwnPropertyNames(data);
    for (const key of propNames) {
      if (key === 'name' || key === 'message' || key === 'stack') {
        continue;
      }
      const val = (data as unknown as Record<string, unknown>)[key];
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        (errorCopy as unknown as Record<string, unknown>)[key] = '[REDACTED]';
      } else {
        (errorCopy as unknown as Record<string, unknown>)[key] = sanitizeData(
          val,
          seen
        );
      }
    }
    return errorCopy;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = sanitizeData(value, seen);
    }
  }

  return result;
}

export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return url;
  }
  return sanitizeString(url);
}
