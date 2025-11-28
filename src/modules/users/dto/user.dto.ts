import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsIn, IsBoolean, MinLength, MaxLength, Matches } from 'class-validator';

// User roles as constants since SQLite doesn't support enums
const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
} as const;

type UserRole = typeof UserRole[keyof typeof UserRole];

/**
 * 👤 Create User DTO
 * Data Transfer Object for creating new users
 */
export class CreateUserDto {
  @ApiProperty({ 
    description: 'User email address',
    example: 'john.doe@example.com' 
  })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Unique username (3-30 characters, lowercase letters, numbers, and underscores only)',
    example: 'marcos_enjuto' 
  })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username must not exceed 30 characters' })
  @Matches(/^[a-z0-9_]+$/, { 
    message: 'Username can only contain lowercase letters, numbers, and underscores' 
  })
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
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ 
    description: 'User last name',
    example: 'Doe',
    required: false 
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ 
    description: 'User role in the system',
    enum: ['ADMIN', 'MANAGER', 'USER'],
    example: UserRole.USER,
    required: false 
  })
  @IsOptional()
  @IsIn(Object.values(UserRole))
  role?: UserRole;

  @ApiProperty({ 
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false 
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}

/**
 * 🔄 Update User DTO
 * Data Transfer Object for updating existing users
 */
export class UpdateUserDto {
  @ApiProperty({ 
    description: 'User email address',
    example: 'john.doe@example.com',
    required: false 
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ 
    description: 'Unique username (3-30 characters, lowercase letters, numbers, and underscores only)',
    example: 'marcos_enjuto',
    required: false 
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username must not exceed 30 characters' })
  @Matches(/^[a-z0-9_]+$/, { 
    message: 'Username can only contain lowercase letters, numbers, and underscores' 
  })
  username?: string;

  @ApiProperty({ 
    description: 'User first name',
    example: 'John',
    required: false 
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ 
    description: 'User last name',
    example: 'Doe',
    required: false 
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ 
    description: 'User role in the system',
    enum: ['ADMIN', 'MANAGER', 'USER'],
    example: UserRole.USER,
    required: false 
  })
  @IsOptional()
  @IsIn(Object.values(UserRole))
  role?: UserRole;

  @ApiProperty({ 
    description: 'Account status',
    example: true,
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ 
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false 
  })
  @IsOptional()
  @IsString()
  avatar?: string;
}

/**
 * 👀 User Response DTO
 * Data Transfer Object for user responses (excludes sensitive data)
 */
export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'First name', required: false })
  firstName?: string;

  @ApiProperty({ description: 'Last name', required: false })
  lastName?: string;

  @ApiProperty({ description: 'User role', enum: ['ADMIN', 'MANAGER', 'USER'] })
  role: UserRole;

  @ApiProperty({ description: 'Account status' })
  isActive: boolean;

  @ApiProperty({ description: 'Avatar URL', required: false })
  avatar?: string;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}
