import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 👤 Get User Decorator
 * 
 * This decorator extracts user information from the request object.
 * It can extract the entire user object or specific properties.
 * 
 * Usage: 
 * - @GetUser() user: User - Gets the entire user object
 * - @GetUser('id') userId: string - Gets only the user ID
 * - @GetUser('email') email: string - Gets only the user email
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
