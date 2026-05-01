import httpError from '../http.errors';

describe('HTTP Errors', () => {
  it('httpError.BadRequest sets code to 400', () => {
    const cause = { field: 'email' };
    const error = new httpError.BadRequest(cause);
    expect(error).toBeInstanceOf(httpError.BadRequest);
    expect(error.code).toBe(400);
    expect(error.message).toBe('http_error_bad_request');
    expect(error.cause).toBe(cause);
  });

  it('httpError.Unauthorized sets code to 401', () => {
    const error = new httpError.Unauthorized();
    expect(error).toBeInstanceOf(httpError.Unauthorized);
    expect(error.code).toBe(401);
    expect(error.message).toBe('http_error_unauthorized');

    const error2 = new httpError.Unauthorized();
    expect(error2).toBeInstanceOf(httpError.Unauthorized);
    expect(error2.code).toBe(401);
    expect(error2.message).toBe('http_error_unauthorized');
  });

  it('httpError.PaymentRequired sets code to 402', () => {
    const error = new httpError.PaymentRequired();
    expect(error).toBeInstanceOf(httpError.PaymentRequired);
    expect(error.code).toBe(402);
    expect(error.message).toBe('http_error_payment_required');
  });

  it('httpError.Forbidden sets code to 403', () => {
    const cause = { userRole: 'guest' };
    const error = new httpError.Forbidden(cause);
    expect(error).toBeInstanceOf(httpError.Forbidden);
    expect(error.code).toBe(403);
    expect(error.message).toBe('http_error_forbidden');
    expect(error.cause).toBe(cause);

    const errorWithoutMessage = new httpError.Forbidden();
    expect(errorWithoutMessage.message).toBe('http_error_forbidden');
  });

  it('httpError.ResourceNotFound sets code to 404', () => {
    const error = new httpError.ResourceNotFound();
    expect(error).toBeInstanceOf(httpError.ResourceNotFound);
    expect(error.code).toBe(404);
    expect(error.message).toBe('http_error_resource_not_found');
  });

  it('httpError.Conflict sets code to 409', () => {
    const error = new httpError.Conflict();
    expect(error).toBeInstanceOf(httpError.Conflict);
    expect(error.code).toBe(409);
    expect(error.message).toBe('http_error_conflict');
  });

  it('httpError.InternalServerError sets code to 500', () => {
    const error = new httpError.InternalServerError();
    expect(error).toBeInstanceOf(httpError.InternalServerError);
    expect(error.code).toBe(500);
    expect(error.message).toBe('http_error_internal_server_error');
  });

  it('httpError.TooManyRequests sets code to 429', () => {
    const cause = { retryAfter: '60s' };
    const error = new httpError.TooManyRequests(cause);
    expect(error).toBeInstanceOf(httpError.TooManyRequests);
    expect(error.code).toBe(429);
    expect(error.message).toBe('http_error_too_many_requests');
    expect(error.cause).toBe(cause);
  });

  it('httpError.TooManyRequests sets code to 429 without cause', () => {
    const error = new httpError.TooManyRequests();
    expect(error).toBeInstanceOf(httpError.TooManyRequests);
    expect(error.code).toBe(429);
    expect(error.message).toBe('http_error_too_many_requests');
    expect(error.cause).toBeUndefined();
  });

  describe('httpError.UnprocessableEntity', () => {
    const validationErrors = [{ field: 'email', message: 'Invalid email' }];

    it('creates an httpError.UnprocessableEntity with default message if none is provided', () => {
      const error = new httpError.UnprocessableEntity(validationErrors);
      expect(error).toBeInstanceOf(httpError.UnprocessableEntity);
      expect(error.code).toBe(422);
      expect(error.message).toBe('http_error_unprocessable_entity'); // Fallback check
      expect(error.validationErrors).toBe(validationErrors);
      expect(error.cause).toBeUndefined();
    });

    it('creates an httpError.UnprocessableEntity with cause', () => {
      const cause = { original: 'Bad data' };
      const error = new httpError.UnprocessableEntity(validationErrors, cause);
      expect(error.code).toBe(422);
      expect(error.message).toBe('http_error_unprocessable_entity');
      expect(error.validationErrors).toBe(validationErrors);
      expect(error.cause).toBe(cause);
    });
  });
});
