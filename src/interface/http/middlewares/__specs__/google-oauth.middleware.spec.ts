import { Request, Response } from 'express';
import passport from 'passport';

import {
  makeCompleteLoginWithGoogleMiddleware,
  makeInitiateLoginWithGoogleMiddleware,
} from '@interface/http/middlewares/google-oauth.middleware';

describe('Google OAuth middleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  it('uses a Secure state cookie in production', () => {
    process.env.NODE_ENV = 'production';
    const authenticate = jest
      .spyOn(passport, 'authenticate')
      .mockReturnValue(jest.fn());
    const res = {
      cookie: jest.fn(),
      setHeader: jest.fn(),
    } as unknown as Response;

    makeInitiateLoginWithGoogleMiddleware()({} as Request, res, jest.fn());

    expect(res.cookie).toHaveBeenCalledWith(
      'oauth_state',
      expect.stringMatching(/^[a-f0-9]{64}$/),
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 600_000,
      })
    );
    expect(authenticate).toHaveBeenCalledWith(
      'google',
      expect.objectContaining({
        state: expect.stringMatching(/^[a-f0-9]{64}$/),
      })
    );
  });

  it('passes Passport operational errors through unchanged', () => {
    const providerError = new Error('token exchange failed');
    jest.spyOn(passport, 'authenticate').mockImplementation(
      (_strategy, _options, callback) =>
        ((req: Request, res: Response) => {
          callback?.(providerError, false, undefined);
        }) as never
    );
    const next = jest.fn();
    const res = {
      clearCookie: jest.fn(),
      setHeader: jest.fn(),
    } as unknown as Response;

    makeCompleteLoginWithGoogleMiddleware(jest.fn())(
      {
        cookies: { oauth_state: 'matching' },
        query: { state: 'matching' },
      } as unknown as Request,
      res,
      next
    );

    expect(next).toHaveBeenCalledWith(providerError);
  });
});
