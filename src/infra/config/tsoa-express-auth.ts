import * as express from 'express';

/**
 * TSOA requires an export named `expressAuthentication` to compile `@Security` decorators.
 * Since authentication is currently handled by Express middlewares (e.g. @Middlewares(middlewares.isAuthenticatedUser)),
 * this module acts as a passthrough to satisfy generating the Swagger documentation without duplicating the auth logic.
 */
export async function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  return Promise.resolve({});
}
