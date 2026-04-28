import { RequestHandler } from 'express';
import passport from 'passport';
import { IUser } from '../../../domain/user/types/user.types';
import { ErrorUnauthorized } from '../../../shared/errors/error';

export function makeInitiateLoginWithGoogleMiddleware(): RequestHandler {
  return passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  });
}

export function makeCompleteLoginWithGoogleMiddleware(
  handleGoogleCallback: (user: IUser) => Promise<string>
): RequestHandler {
  return async (req, res, next) => {
    passport.authenticate(
      'google',
      { session: false },
      async (err: unknown, user?: IUser | false) => {
        try {
          if (err || !user) {
            return next(new ErrorUnauthorized('unauthorized'));
          }

          const redirectUrl = await handleGoogleCallback(user);
          return res.redirect(redirectUrl);
        } catch (error) {
          return next(error);
        }
      }
    )(req, res, next);
  };
}
