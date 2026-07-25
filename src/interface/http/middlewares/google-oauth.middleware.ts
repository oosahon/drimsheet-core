import { RequestHandler } from 'express';
import { randomBytes } from 'node:crypto';
import passport from 'passport';
import { IUser } from '../../../domain/user/types/user.types';
import appError from '../../../shared/errors/app.error';

export function makeInitiateLoginWithGoogleMiddleware(): RequestHandler {
  return (req, res, next) => {
    const stateToken = randomBytes(32).toString('hex');
    res.cookie('oauth_state', stateToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/api/v1/auth',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 10,
    });

    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
      state: stateToken,
    })(req, res, next);
  };
}

export function makeCompleteLoginWithGoogleMiddleware(
  handleGoogleCallback: (user: IUser) => Promise<string>
): RequestHandler {
  return (req, res, next) => {
    const stateCookie = req.cookies?.oauth_state;
    const queryState = req.query?.state;

    res.clearCookie('oauth_state', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/api/v1/auth',
      sameSite: 'lax',
    });

    if (
      !stateCookie ||
      !queryState ||
      typeof queryState !== 'string' ||
      stateCookie !== queryState
    ) {
      return next(new appError.Unauthorized());
    }

    passport.authenticate(
      'google',
      { session: false },
      (err: unknown, user?: IUser | false) => {
        if (err || !user) {
          return next(new appError.Unauthorized());
        }

        handleGoogleCallback(user)
          .then((redirectUrl) => {
            res.redirect(redirectUrl);
          })
          .catch((error) => {
            next(error);
          });
      }
    )(req, res, next);
  };
}
