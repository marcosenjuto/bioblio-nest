/**
 * ⚠️ DEPRECATED - Google OAuth2 Guard (Passport.js)
 * 
 * This guard is no longer used. We switched to the ID Token validation flow.
 * 
 * The new implementation doesn't need a guard - it's a simple POST endpoint
 * that validates the id_token sent by the frontend.
 * 
 * See: auth.controller.ts → POST /google/callback
 */

/*
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor() {
    super();
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
*/