const fs = require('fs');
const path = require('path');

const httpErrorsPath = path.join(__dirname, 'src/app/errors/http.errors.ts');
let content = fs.readFileSync(httpErrorsPath, 'utf-8');

// Replace ErrorBadRequest
content = content.replace(
  /constructor\(message: string, cause\?: TErrorCause\) \{\s*super\(EErrorKeys\.BadRequest, 400, message, cause\);\s*\}/g,
  `constructor(cause?: TErrorCause) {\n    super(EErrorKeys.BadRequest, 400, 'Bad Request', cause);\n  }`
);

// Replace ErrorUnauthorized
content = content.replace(
  /constructor\(message\?: string, cause\?: TErrorCause\) \{\s*super\(EErrorKeys\.Unauthorized, 401, message \|\| 'Unauthorized', cause\);\s*\}/g,
  `constructor(cause?: TErrorCause) {\n    super(EErrorKeys.Unauthorized, 401, 'Unauthorized', cause);\n  }`
);

// Replace ErrorPaymentRequired
content = content.replace(
  /constructor\(message: string, cause\?: TErrorCause\) \{\s*super\(EErrorKeys\.PaymentRequired, 402, message, cause\);\s*\}/g,
  `constructor(cause?: TErrorCause) {\n    super(EErrorKeys.PaymentRequired, 402, 'Payment Required', cause);\n  }`
);

// Replace ErrorForbidden
content = content.replace(
  /constructor\(message\?: string, cause\?: TErrorCause\) \{\s*super\(EErrorKeys\.Forbidden, 403, message \|\| 'Forbidden', cause\);\s*\}/g,
  `constructor(cause?: TErrorCause) {\n    super(EErrorKeys.Forbidden, 403, 'Forbidden', cause);\n  }`
);

// Replace ErrorResourceNotFound
content = content.replace(
  /constructor\(message: string, cause\?: TErrorCause\) \{\s*super\(EErrorKeys\.ResourceNotFound, 404, message, cause\);\s*\}/g,
  `constructor(cause?: TErrorCause) {\n    super(EErrorKeys.ResourceNotFound, 404, 'Resource Not Found', cause);\n  }`
);

// Replace ErrorConflict
content = content.replace(
  /constructor\(message: string, cause\?: TErrorCause\) \{\s*super\(EErrorKeys\.Conflict, 409, message, cause\);\s*\}/g,
  `constructor(cause?: TErrorCause) {\n    super(EErrorKeys.Conflict, 409, 'Conflict', cause);\n  }`
);

// Replace ErrorUnprocessableEntity
content = content.replace(
  /constructor\(\s*validationErrors: IApiValidationError\[\],\s*message\?: string,\s*cause\?: TErrorCause\s*\) \{\s*super\(EErrorKeys\.UnprocessableEntity, 422, message \|\| 'Unprocessable Entity', cause\);\s*this\.validationErrors = validationErrors;\s*\}/g,
  `constructor(\n    validationErrors: IApiValidationError[],\n    cause?: TErrorCause\n  ) {\n    super(EErrorKeys.UnprocessableEntity, 422, 'Unprocessable Entity', cause);\n    this.validationErrors = validationErrors;\n  }`
);

// Replace ErrorTooManyRequests
content = content.replace(
  /constructor\(message: string, cause\?: TErrorCause\) \{\s*super\(EErrorKeys\.TooManyRequests, 429, message, cause\);\s*\}/g,
  `constructor(cause?: TErrorCause) {\n    super(EErrorKeys.TooManyRequests, 429, 'Too Many Requests', cause);\n  }`
);

// Replace ErrorInternalServerError
content = content.replace(
  /constructor\(message: string, cause\?: TErrorCause\) \{\s*super\(EErrorKeys\.InternalServerError, 500, message, cause\);\s*\}/g,
  `constructor(cause?: TErrorCause) {\n    super(EErrorKeys.InternalServerError, 500, 'Internal Server Error', cause);\n  }`
);

fs.writeFileSync(httpErrorsPath, content, 'utf-8');
console.log('http.errors.ts updated.');
