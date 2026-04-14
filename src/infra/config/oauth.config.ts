import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from 'passport-google-oauth20';
import authUseCase from '../../app/usecases/auth';
import {
  GOOGLE_AUTH_CALLBACK_URL,
  GOOGLE_AUTH_CLIENT_ID,
  GOOGLE_AUTH_SECRET,
} from './vars.config';

export default function setupOAuth() {
  if (!GOOGLE_AUTH_CLIENT_ID || !GOOGLE_AUTH_SECRET) {
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_AUTH_CLIENT_ID,
        clientSecret: GOOGLE_AUTH_SECRET,
        callbackURL: GOOGLE_AUTH_CALLBACK_URL,
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => {
        try {
          const gUser = {
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            email: profile.emails?.[0].value || '',
          };

          await authUseCase.googleOAuthHelper(gUser, done);
        } catch (error) {
          done(error as Error, false);
        }
      }
    )
  );
}
