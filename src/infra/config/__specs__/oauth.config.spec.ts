import { Profile } from 'passport-google-oauth20';

import { mapGoogleProfile } from '@infra/config/oauth.config';

describe('mapGoogleProfile', () => {
  it('maps the stable Google subject and verified primary email', () => {
    const profile = {
      id: 'google-subject-123',
      name: { givenName: 'Ada', familyName: 'Lovelace' },
      emails: [{ value: 'ada@example.com', verified: true }],
    } as Profile;

    expect(mapGoogleProfile(profile)).toEqual({
      providerSubject: 'google-subject-123',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      emailVerified: true,
    });
  });

  it('does not infer verification when Google omits identity fields', () => {
    const profile = { id: 'google-subject-123' } as Profile;

    expect(mapGoogleProfile(profile)).toEqual({
      providerSubject: 'google-subject-123',
      firstName: '',
      lastName: '',
      email: '',
      emailVerified: false,
    });
  });
});
