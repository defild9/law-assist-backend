import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
type GoogleUser = {
  email: string;
  picture: string;
  displayName: string;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    });
  }

  authorizationParams(options: any): object {
    return {
      prompt: 'consent',
      state: options?.state || '',
    };
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GoogleUser,
    done: VerifyCallback,
  ) {
    const { displayName, email, picture } = profile;

    const user = {
      username: displayName,
      email,
      avatar: picture,
    };

    done(null, user);
  }
}
