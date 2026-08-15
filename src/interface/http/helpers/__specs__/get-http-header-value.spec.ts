import getHttpHeaderValue from '@interface/http/helpers/get-http-header-value';

describe('getHttpHeaderValue', () => {
  it('returns a string header value', () => {
    const headers = { 'x-custom-header': 'value1' };

    expect(getHttpHeaderValue('x-custom-header', headers)).toBe('value1');
  });

  it('returns the first value from an array header', () => {
    const headers = { 'x-custom-header': ['value1', 'value2'] };

    expect(getHttpHeaderValue('x-custom-header', headers)).toBe('value1');
  });

  it('returns undefined when the header is not present', () => {
    expect(getHttpHeaderValue('x-custom-header', {})).toBeUndefined();
  });
});
