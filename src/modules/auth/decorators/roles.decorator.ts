import { SetMetadata } from '@nestjs/common';

// User roles as constants since SQLite doesn't support enums
const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
} as const;

type UserRole = typeof UserRole[keyof typeof UserRole];

/**
 * 🏷️ Roles Decorator
 * 
 * This decorator is used to specify which roles are required
 * to access a specific route or resource.
 * 
 * Usage: @Roles(UserRole.ADMIN, UserRole.MANAGER)
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
