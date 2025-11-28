import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * 🛡️ JWT Strategy
 * 
 * This strategy validates JWT tokens and extracts user information
 * for protected routes.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
    });
  }

  /**
   * Validate the JWT payload and return user information
   */
  async validate(payload: any) {
    try {
      console.log('🔐 [JwtStrategy] Validating token payload:', { sub: payload.sub, email: payload.email, jti: payload.jti?.substring(0, 8) });
      const user = await this.authService.validateUser(payload);
      console.log('✅ [JwtStrategy] User validated:', { userId: user.id, email: user.email });
      return user;
    } catch (error) {
      console.error('❌ [JwtStrategy] Validation failed:', error.message);
      throw new UnauthorizedException('Invalid token or user not found');
    }
  }
}
