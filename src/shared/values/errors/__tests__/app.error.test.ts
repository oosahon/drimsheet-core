import appError from '@shared/values/errors/app.error';

describe('App Errors', () => {
  it('appError.BadRequest creates error with app_error_request_invalid', () => {
    const cause = { field: 'email' };
    const error = new appError.BadRequest(cause);
    expect(error).toBeInstanceOf(appError.BadRequest);
    expect(error.errorKey).toBe('app_error_request_invalid');
    expect(error.message).toBe('app_error_request_invalid');
    expect(error.cause).toBe(cause);
  });

  it('appError.Unauthorized creates error with app_error_unauthorized', () => {
    const error = new appError.Unauthorized();
    expect(error).toBeInstanceOf(appError.Unauthorized);
    expect(error.errorKey).toBe('app_error_unauthorized');
    expect(error.message).toBe('app_error_unauthorized');

    const error2 = new appError.Unauthorized();
    expect(error2).toBeInstanceOf(appError.Unauthorized);
    expect(error2.errorKey).toBe('app_error_unauthorized');
    expect(error2.message).toBe('app_error_unauthorized');
  });

  it('appError.PaymentRequired creates error with app_error_payment_required', () => {
    const error = new appError.PaymentRequired();
    expect(error).toBeInstanceOf(appError.PaymentRequired);
    expect(error.errorKey).toBe('app_error_payment_required');
    expect(error.message).toBe('app_error_payment_required');
  });

  it('appError.Forbidden creates error with app_error_forbidden', () => {
    const cause = { userRole: 'guest' };
    const error = new appError.Forbidden(cause);
    expect(error).toBeInstanceOf(appError.Forbidden);
    expect(error.errorKey).toBe('app_error_forbidden');
    expect(error.message).toBe('app_error_forbidden');
    expect(error.cause).toBe(cause);

    const errorWithoutMessage = new appError.Forbidden();
    expect(errorWithoutMessage.message).toBe('app_error_forbidden');
  });

  it('appError.ResourceNotFound creates error with app_error_resource_not_found', () => {
    const error = new appError.ResourceNotFound();
    expect(error).toBeInstanceOf(appError.ResourceNotFound);
    expect(error.errorKey).toBe('app_error_resource_not_found');
    expect(error.message).toBe('app_error_resource_not_found');
  });

  it('appError.Conflict creates error with app_error_conflict', () => {
    const error = new appError.Conflict();
    expect(error).toBeInstanceOf(appError.Conflict);
    expect(error.errorKey).toBe('app_error_conflict');
    expect(error.message).toBe('app_error_conflict');
  });

  it('appError.InternalServerError creates error with app_error_unexpected', () => {
    const error = new appError.InternalServerError();
    expect(error).toBeInstanceOf(appError.InternalServerError);
    expect(error.errorKey).toBe('app_error_unexpected');
    expect(error.message).toBe('app_error_unexpected');
  });

  it('appError.TooManyRequests creates error with app_error_too_many_requests', () => {
    const cause = { retryAfter: '60s' };
    const error = new appError.TooManyRequests(cause);
    expect(error).toBeInstanceOf(appError.TooManyRequests);
    expect(error.errorKey).toBe('app_error_too_many_requests');
    expect(error.message).toBe('app_error_too_many_requests');
    expect(error.cause).toBe(cause);
  });

  it('appError.TooManyRequests creates error with app_error_too_many_requests without cause', () => {
    const error = new appError.TooManyRequests();
    expect(error).toBeInstanceOf(appError.TooManyRequests);
    expect(error.errorKey).toBe('app_error_too_many_requests');
    expect(error.message).toBe('app_error_too_many_requests');
    expect(error.cause).toBeUndefined();
  });

  describe('appError.UnprocessableEntity', () => {
    const validationErrors = [
      { field: 'email', message: 'auth_error_email_invalid' },
    ];

    it('creates an appError.UnprocessableEntity with default message if none is provided', () => {
      const error = new appError.UnprocessableEntity(validationErrors);
      expect(error).toBeInstanceOf(appError.UnprocessableEntity);
      expect(error.errorKey).toBe('app_error_validation_error');
      expect(error.message).toBe('app_error_validation_error'); // Fallback check
      expect(error.validationErrors).toBe(validationErrors);
      expect(error.cause).toBeUndefined();
    });

    it('creates an appError.UnprocessableEntity with cause', () => {
      const cause = { original: 'Bad data' };
      const error = new appError.UnprocessableEntity(validationErrors, cause);
      expect(error.errorKey).toBe('app_error_validation_error');
      expect(error.message).toBe('app_error_validation_error');
      expect(error.validationErrors).toBe(validationErrors);
      expect(error.cause).toBe(cause);
    });
  });
});
