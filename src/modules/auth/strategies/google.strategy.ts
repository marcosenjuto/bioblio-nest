/**
 * ⚠️ DEPRECATED - Google Passport Strategy
 * 
 * This file is no longer used. We switched to the simpler ID Token validation flow.
 * 
 * Old flow (Passport.js):
 * - User → Google → Backend redirect → Backend exchanges code → Returns JWT
 * 
 * New flow (ID Token):
 * - User → Google → Frontend gets id_token → Backend validates id_token → Returns JWT
 * 
 * The new flow is implemented in:
 * - auth.service.ts: exchangeGoogleAuthCode() method
 * - auth.controller.ts: POST /google/callback endpoint
 * 
 * This file is kept for reference but not imported anywhere.
 */

/*
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || 'http://localhost:3001/api/v1/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { id, name, emails, photos } = profile;

      const googleUser = {
        googleId: id,
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        avatar: photos[0]?.value,
        accessToken,
        refreshToken,
      };

      const user = await this.authService.validateGoogleUser(googleUser);
      
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
*/