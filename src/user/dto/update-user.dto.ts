import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: "URL to the user's profile picture",
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  profile_picture?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}
