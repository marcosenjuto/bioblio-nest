import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * 🔐 Login DTO
 * Data Transfer Object for user authentication
 */
export class LoginDto {
  @ApiProperty({ 
    description: 'User email address',
    example: 'john.doe@example.com' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'User password',
    example: 'securePassword123' 
  })
  @IsString()
  @MinLength(6)
  password: string;
}

/**
 * 📝 Register DTO
 * Data Transfer Object for user registration
 */
export class RegisterDto {
  @ApiProperty({ 
    description: 'User email address',
    example: 'john.doe@example.com' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Unique username',
    example: 'johndoe123' 
  })
  @IsString()
  username: string;

  @ApiProperty({ 
    description: 'User password (minimum 6 characters)',
    example: 'securePassword123',
    minLength: 6 
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    description: 'User first name',
    example: 'John',
    required: false 
  })
  @IsString()
  firstName?: string;

  @ApiProperty({ 
    description: 'User last name',
    example: 'Doe',
    required: false 
  })
  @IsString()
  lastName?: string;
}

/**
 * 🎟️ Auth Response DTO
 * Data Transfer Object for authentication responses
 */
export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token (short-lived, 15min)' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token (long-lived, 60 days with sliding expiration)' })
  refreshToken: string;

  @ApiProperty({ description: 'User information' })
  user: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    role: string;
    isActive: boolean;
  };
}

/**
 * 🌐 Google Auth Response DTO
 * Data Transfer Object for Google OAuth2 authentication responses
 */
export class GoogleAuthResponseDto extends AuthResponseDto {
  @ApiProperty({ description: 'Google authentication provider', example: 'google' })
  provider: string;

  @ApiProperty({ description: 'Whether this is a new user registration', example: false })
  isNewUser: boolean;
}

/**
 * 🔄 Refresh Token DTO
 * Data Transfer Object for token refresh requests
 */
export class RefreshTokenDto {
  @ApiProperty({ 
    description: 'Refresh token to exchange for new access token',
    example: 'a1b2c3d4e5f6g7h8i9j0...'
  })
  @IsString()
  refreshToken: string;
}
