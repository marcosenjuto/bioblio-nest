import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
// User roles as constants since SQLite doesn't support enums
const UserRole = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
} as const;

type UserRole = typeof UserRole[keyof typeof UserRole];

/**
 * 👤 Users Controller
 * 
 * This controller handles all user-related HTTP requests including:
 * - User registration and management
 * - User profile operations
 * - User statistics and reporting
 * - Role-based access control
 */
@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create a new user (Admin only)
   */
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Creates a new user account. Only accessible by administrators.' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'User with email or username already exists' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required' 
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  /**
   * Get all users with pagination and filtering
   */
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Retrieves a paginated list of users with optional filtering by role and status.' 
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    description: 'Page number (default: 1)' 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    description: 'Items per page (default: 10)' 
  })
  @ApiQuery({ 
    name: 'role', 
    required: false, 
    enum: UserRole, 
    description: 'Filter by user role' 
  })
  @ApiQuery({ 
    name: 'isActive', 
    required: false, 
    type: Boolean, 
    description: 'Filter by active status' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Users retrieved successfully' 
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: boolean,
  ) {
    return this.usersService.findAll(page, limit, role, isActive);
  }

  /**
   * Get current user profile
   */
  @Get('me')
  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Retrieves the profile of the currently authenticated user.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    type: UserResponseDto 
  })
  async getCurrentUser(@GetUser('id') userId: string): Promise<UserResponseDto> {
    return this.usersService.findOne(userId);
  }

  /**
   * Get user statistics (Admin only)
   */
  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Get user statistics',
    description: 'Retrieves comprehensive user statistics including totals and role distribution.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved successfully' 
  })
  async getStatistics() {
    return this.usersService.getStatistics();
  }

  /**
   * Get user by ID
   */
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by their unique identifier.' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User unique identifier' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User found successfully',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  /**
   * Update current user profile
   */
  @Patch('me')
  @ApiOperation({ 
    summary: 'Update current user profile',
    description: 'Updates the profile of the currently authenticated user. Users can update their username, first name, last name, and avatar.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Profile updated successfully',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Email or username already exists' 
  })
  async updateCurrentUser(
    @GetUser('id') userId: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    // Users can update their username, names, and avatar (but not email or role)
    const allowedFields = ['username', 'firstName', 'lastName', 'avatar'];
    const filteredDto = Object.keys(updateUserDto)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateUserDto[key];
        return obj;
      }, {});

    return this.usersService.update(userId, filteredDto);
  }

  /**
   * Update user by ID (Admin/Manager only)
   */
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Update user by ID',
    description: 'Updates a specific user account. Full access for admins.' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User unique identifier' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User updated successfully',
    type: UserResponseDto 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Email or username already exists' 
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Change password
   */
  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Change current user password',
    description: 'Changes the password for the currently authenticated user.' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Password changed successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Current password is incorrect' 
  })
  async changePassword(
    @GetUser('id') userId: string,
    @Body() passwordData: { currentPassword: string; newPassword: string }
  ) {
    return this.usersService.changePassword(
      userId,
      passwordData.currentPassword,
      passwordData.newPassword
    );
  }

  /**
   * Deactivate user (soft delete)
   */
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Deactivate user',
    description: 'Deactivates a user account (soft delete). Only accessible by administrators.' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User unique identifier' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User deactivated successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required' 
  })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  /**
   * Permanently delete user (Admin only)
   */
  @Delete(':id/permanent')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Permanently delete user',
    description: 'Permanently deletes a user account. This action cannot be undone.' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User unique identifier' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User permanently deleted' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  async hardDelete(@Param('id') id: string) {
    return this.usersService.hardDelete(id);
  }
}
