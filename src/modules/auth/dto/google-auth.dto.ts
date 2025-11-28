import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for Google ID Token Validation
 * The frontend uses Google Identity Services SDK and sends the id_token (JWT) directly
 */
export class GoogleAuthCodeDto {
  @ApiProperty({
    description: 'Google ID Token (JWT) received from Google Identity Services',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjI3...',
  })
  @IsString()
  @IsNotEmpty()
  id_token: string;
}
