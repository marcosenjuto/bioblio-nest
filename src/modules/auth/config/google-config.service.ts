import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * 🌐 Google OAuth2 Configuration Service
 * 
 * This service provides Google OAuth2 configuration values
 * and validates required environment variables.
 */
@Injectable()
export class GoogleConfigService {
  constructor(private configService: ConfigService) {}

  get clientId(): string {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID environment variable is required for Google OAuth2');
    }
    return clientId;
  }

  get clientSecret(): string {
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    if (!clientSecret) {
      throw new Error('GOOGLE_CLIENT_SECRET environment variable is required for Google OAuth2');
    }
    return clientSecret;
  }

  get callbackUrl(): string {
    return this.configService.get<string>('GOOGLE_CALLBACK_URL') || 
           'http://localhost:3001/api/v1/auth/google/callback';
  }

  get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
  }

  /**
   * Validate that all required Google OAuth2 environment variables are set
   */
  validateConfig(): void {
    this.clientId; // Will throw if not set
    this.clientSecret; // Will throw if not set
  }
}