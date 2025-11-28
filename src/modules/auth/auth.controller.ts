import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, AuthResponseDto, GoogleAuthResponseDto, RefreshTokenDto } from './dto/auth.dto';
import { GoogleAuthCodeDto } from './dto/google-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { Request, Response } from 'express';

/**
 * 🔐 Authentication Controller
 * 
 * This controller handles all authentication-related HTTP requests including:
 * - User login and registration
 * - Token generation and validation
 * - Authentication status checking
 */
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * User login endpoint
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticates a user and returns a JWT token along with user information.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials or account deactivated' 
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  /**
   * User registration endpoint
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'User registration',
    description: 'Creates a new user account and returns a JWT token along with user information.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Registration successful',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'User with email or username already exists' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Validation error - invalid input data' 
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  /**
   * Get current user profile (requires authentication)
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Returns the profile information of the currently authenticated user.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile retrieved successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token' 
  })
  async getProfile(@GetUser() user: any) {
    return user;
  }

  /**
   * Refresh tokens with sliding expiration
   * Validates refresh token and extends its expiration by 60 days
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Validates the refresh token and returns a new access token. ' +
                 'Implements sliding expiration: each refresh extends the refresh token by 60 days. ' +
                 'After 60 days of complete inactivity, the refresh token expires and user must login again.' 
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token received from login/register',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully. Returns new access token and same refresh token (with extended expiration).',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'a1b2c3d4e5f6g7h8i9j0...' // Same token, expiration extended in DB
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid or expired refresh token' 
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  /**
   * Check authentication status
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ 
    summary: 'Check authentication status',
    description: 'Verifies if the current token is valid and returns authentication status.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Authentication status verified' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token' 
  })
  async checkStatus(@GetUser() user: any) {
    return {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  /**
   * ⚠️ DISABLED - Google OAuth2 Passport.js Flow (Redirect-based)
   * This flow is disabled in favor of the Authorization Code Flow below.
   * Uncomment these endpoints if you need the Passport.js redirect flow.
   */
  
  /*
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ 
    summary: 'Google OAuth2 login (Passport.js)',
    description: 'Initiates Google OAuth2 authentication flow. Redirects user to Google authorization server.' 
  })
  @ApiResponse({ 
    status: 302, 
    description: 'Redirect to Google OAuth2 authorization server' 
  })
  async googleAuth(@Req() req: Request) {
    // The GoogleAuthGuard will handle the redirection to Google
    // This endpoint initiates the OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ 
    summary: 'Google OAuth2 callback (Passport.js)',
    description: 'Handles Google OAuth2 callback and returns JWT token with user information.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Google authentication successful',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Google authentication failed' 
  })
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    // Extract user from request (populated by GoogleStrategy)
    const authResult = req.user as AuthResponseDto;
    
    if (!authResult) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/error?message=Authentication failed`);
    }

    // Successful authentication, redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/success?token=${authResult.accessToken}`;
    return res.redirect(redirectUrl);
  }
  */

  /**
   * 🔐 Google OAuth2 - ID Token Validation (Simpler Flow)
   * 
   * Frontend uses Google Identity Services SDK (google-auth-library) to:
   * 1. Let user sign in with Google
   * 2. Receive id_token (credential) from Google
   * 3. Send id_token to this endpoint
   * 4. Backend validates token and returns JWT
   * 
   * NO redirect_uri needed, NO authorization code exchange, MUCH simpler!
   */
  @Post('google/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Google OAuth2 - Validate ID Token',
    description: 'Validates a Google ID Token (credential) received from Google Identity Services SDK. ' +
                 'Frontend should use Google\'s JavaScript library to get the id_token and send it here.' 
  })
  @ApiBody({
    type: GoogleAuthCodeDto,
    description: 'Google ID Token (credential) from Google Identity Services',
    examples: {
      example1: {
        summary: 'ID Token from Google Identity Services',
        value: {
          id_token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjI3...'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Authorization code exchanged successfully',
    type: GoogleAuthResponseDto,
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        provider: 'google',
        isNewUser: false,
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'user@gmail.com',
          username: 'google_1234567890',
          firstName: 'John',
          lastName: 'Doe',
          avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJ...',
          role: 'USER',
          isActive: true,
        },
      },
    },
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid authorization code or Google authentication failed',
    schema: {
      example: {
        message: 'Invalid authorization code',
        error: 'INVALID_AUTHORIZATION_CODE',
        details: 'The authorization code is invalid, expired, or has already been used. Please try signing in again.',
      },
    },
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Google email not verified or account deactivated',
    schema: {
      example: {
        message: 'Google email is not verified',
        error: 'EMAIL_NOT_VERIFIED',
        details: 'Please verify your email address with Google before signing in.',
      },
    },
  })
  async googleAuthCallback(@Body() googleAuthCodeDto: GoogleAuthCodeDto): Promise<GoogleAuthResponseDto> {
    console.log('📨 [Controller] Received Google ID token');
    
    const result = await this.authService.exchangeGoogleAuthCode(googleAuthCodeDto);
    console.log('✅ [Controller] Google OAuth successful');
    return result;
  }
}
