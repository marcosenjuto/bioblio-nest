import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto, AuthResponseDto, GoogleAuthResponseDto, RefreshTokenDto } from './dto/auth.dto';
import { GoogleAuthCodeDto } from './dto/google-auth.dto';
import { CreateUserDto } from '../users/dto/user.dto';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import * as crypto from 'crypto';

/**
 * 🔐 Authentication Service
 * 
 * This service handles all authentication-related operations including:
 * - User login and token generation
 * - User registration
 * - Token validation
 * - Password verification
 */
@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Initialize Google OAuth2 Client (only need CLIENT_ID for ID token validation)
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  /**
   * 🔄 Generate Access and Refresh Tokens (60-day sliding expiration)
   */
  private async generateTokens(userId: string, email: string, role: string): Promise<{ accessToken: string; refreshToken: string }> {
    const now = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
    const jti = crypto.randomBytes(16).toString('hex'); // Unique JWT ID
    
    const payload = { 
      sub: userId, 
      email, 
      role,
      iat: now, // Issued at - ensures tokens are unique even if generated quickly
      jti, // JWT ID - unique identifier for this specific token
    };
    
    // Short-lived access token (60 minutes)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '60m',
    });
    
    // Generate secure refresh token (random string)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    
    // Store refresh token in database (60 days expiry)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60); // 60 days from now
    
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });
    
    console.log(`🔑 [Tokens] Generated NEW tokens for user ${email} - JWT ID: ${jti.substring(0, 8)}...`);
    
    return { accessToken, refreshToken };
  }

  /**
   * Authenticate user and generate JWT token
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens (access + refresh)
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    // Return user data without password
    const { password: userPassword, ...userWithoutPassword } = user;

    return {
      ...tokens,
      user: userWithoutPassword,
    };
  }

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    // Create user using the users service
    const createUserDto: CreateUserDto = {
      email: registerDto.email,
      username: registerDto.username,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    };

    const user = await this.usersService.create(createUserDto);

    // Generate tokens (access + refresh)
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      ...tokens,
      user,
    };
  }

  /**
   * Validate user for JWT strategy
   */
  async validateUser(payload: any) {
    try {
      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.isActive) {
        console.error(`❌ [JWT Validation] User ${payload.sub} not found or inactive`);
        throw new UnauthorizedException({
          statusCode: 401,
          message: 'Invalid or expired token',
          error: 'INVALID_TOKEN',
          details: 'The user associated with this token no longer exists or is deactivated. Please login again.',
        });
      }
      return user;
    } catch (error) {
      // User not found in database (deleted)
      console.error(`❌ [JWT Validation] Token validation failed for user ${payload.sub}:`, error.message);
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid or expired token',
        error: 'INVALID_TOKEN',
        details: 'The user associated with this token no longer exists. Please login again.',
      });
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.validateUser(payload);
      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(userId: string): Promise<{ accessToken: string }> {
    const user = await this.usersService.findOne(userId);
    
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  /**
   * 🔐 Validate Google ID Token (Simpler Flow)
   * 
   * Frontend uses Google Identity Services SDK to get id_token directly.
   * No authorization code exchange needed - just validate the token.
   */
  async exchangeGoogleAuthCode(googleAuthCodeDto: GoogleAuthCodeDto): Promise<GoogleAuthResponseDto> {
    const { id_token } = googleAuthCodeDto;

    console.log('🔐 [Google OAuth] Validating ID token...');

    try {
      // Verify the ID token with Google's public keys
      const ticket = await this.googleClient.verifyIdToken({
        idToken: id_token,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      
      const payload = ticket.getPayload();
      
      if (!payload || !payload.email_verified) {
        throw new BadRequestException('Invalid or unverified Google account');
      }

      // Extract user info
      const googleUser = {
        googleId: payload.sub,
        email: payload.email!,
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        avatar: payload.picture,
      };

      console.log('👤 [Google OAuth] User:', googleUser.email);

      // Find or create user
      let user = await this.usersService.findByEmail(googleUser.email);
      let isNewUser = false;

      console.log('🔍 [Google OAuth] Database lookup result:', user ? `Found user ${user.id}` : 'User not found');

      if (!user) {
        console.log('➕ [Google OAuth] Creating new user for email:', googleUser.email);
        isNewUser = true;
        
        // Generate user-friendly username from first and last name
        const baseUsername = await this.generateFriendlyUsername(
          googleUser.firstName, 
          googleUser.lastName, 
          googleUser.email
        );
        
        const createUserDto: CreateUserDto = {
          email: googleUser.email,
          username: baseUsername,
          password: Math.random().toString(36).substring(2, 15),
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          avatar: googleUser.avatar, // Save Google profile picture
        };

        const createdUser = await this.usersService.create(createUserDto);
        console.log('✅ [Google OAuth] User created:', createdUser.id);
        
        user = await this.usersService.findByEmail(createdUser.email);
        console.log('🔍 [Google OAuth] Re-fetched user:', user?.id);
        
        if (!user) {
          throw new BadRequestException('Failed to create user');
        }
      } else {
        console.log('✅ [Google OAuth] Existing user found:', user.id);
        if (!user.isActive) {
          console.error('❌ [Google OAuth] User is deactivated:', user.id);
          throw new UnauthorizedException('Account is deactivated');
        }
      }

      console.log('🔑 [Google OAuth] Generating tokens for user:', user.id);
      // Generate access and refresh tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      console.log('✅ [Google OAuth] Success - User ID:', user.id, 'Email:', user.email);

      return {
        ...tokens,
        provider: 'google',
        isNewUser,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          avatar: googleUser.avatar || user.avatar || undefined, // Use Google's avatar
          role: user.role,
          isActive: user.isActive,
        },
      };

    } catch (error) {
      console.error('❌ [Google OAuth] Error:', error.message);
      
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new BadRequestException({
        message: 'Failed to authenticate with Google',
        error: 'GOOGLE_AUTH_FAILED',
        details: error.message,
      });
    }
  }

  /**
   * Refresh tokens with sliding expiration
   * Validates the refresh token and extends its expiration by 60 days
   * Returns a new access token while keeping the same refresh token
   */
  async refreshTokens(dto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken } = dto;

    console.log('🔍 [Refresh] Validating refresh token...');

    // Find the refresh token in database
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      console.error('❌ [Refresh] Invalid refresh token - not found in database');
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Invalid refresh token',
        error: 'INVALID_REFRESH_TOKEN',
        details: 'The refresh token does not exist or has been revoked',
      });
    }

    // Check if user still exists (in case of hard delete)
    if (!storedToken.user) {
      console.error('❌ [Refresh] User no longer exists - cleaning up token');
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'User account not found',
        error: 'USER_NOT_FOUND',
        details: 'The user associated with this token no longer exists',
      });
    }

    console.log('🔍 [Refresh] Token found for user:', storedToken.user.email);

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      console.error('❌ [Refresh] Token expired - cleaning up');
      // Clean up expired token
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Refresh token expired',
        error: 'TOKEN_EXPIRED',
        details: 'The refresh token has expired. Please login again.',
      });
    }

    // Check if user is active (soft deleted)
    if (!storedToken.user.isActive) {
      console.error('❌ [Refresh] User account deactivated - cleaning up token');
      await this.prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw new UnauthorizedException({
        statusCode: 401,
        message: 'Account is deactivated',
        error: 'ACCOUNT_DEACTIVATED',
        details: 'This account has been deactivated. Please contact support.',
      });
    }

    console.log('✅ [Refresh] Token valid - extending expiration by 60 days');

    // Sliding expiration: Extend token by 60 days from now
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 60);

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { expiresAt: newExpiresAt },
    });

    // Generate new access token with unique identifiers
    const now = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
    const jti = crypto.randomBytes(16).toString('hex'); // Unique JWT ID
    
    const payload = {
      sub: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      iat: now, // Issued at - ensures tokens are unique
      jti, // JWT ID - unique identifier
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '60m' });

    console.log(`✅ [Refresh] New access token generated - JWT ID: ${jti.substring(0, 8)}... - valid for 60 minutes`);

    // Return new access token and same refresh token (now with extended expiration)
    return {
      accessToken,
      refreshToken, // Same token, but expiration extended in DB
    };
  }

  /**
   * 🎯 Generate user-friendly username from name
   * Creates a username like "marcos_enjuto" or "marcos_e_1234" if taken
   */
  private async generateFriendlyUsername(
    firstName: string | undefined, 
    lastName: string | undefined, 
    email: string
  ): Promise<string> {
    // Normalize and clean names
    const cleanName = (name: string | undefined) => {
      if (!name) return '';
      return name
        .toLowerCase()
        .normalize('NFD') // Decompose accented characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    };

    const cleanFirst = cleanName(firstName);
    const cleanLast = cleanName(lastName);

    // Generate base username
    let baseUsername: string;
    if (cleanFirst && cleanLast) {
      baseUsername = `${cleanFirst}_${cleanLast}`;
    } else if (cleanFirst) {
      baseUsername = cleanFirst;
    } else if (cleanLast) {
      baseUsername = cleanLast;
    } else {
      // Fallback to email prefix if no names available
      const emailPrefix = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
      baseUsername = emailPrefix;
    }

    // Check if username is available
    let username = baseUsername;
    let suffix = 1;
    
    while (await this.usernameExists(username)) {
      // Add random suffix if taken
      const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4-digit number
      username = `${baseUsername}_${randomSuffix}`;
      suffix++;
      
      // Safety check to prevent infinite loop
      if (suffix > 10) {
        username = `${baseUsername}_${Date.now().toString().slice(-6)}`;
        break;
      }
    }

    console.log(`🎯 [Username] Generated: ${username} (from ${firstName} ${lastName})`);
    return username;
  }

  /**
   * Check if username already exists
   */
  private async usernameExists(username: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    return !!user;
  }

}
