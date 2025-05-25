import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: "URL to the user's profile picture",
    example: 'https://example.com/profile.jpg',
  })
  @IsOptional()
  @IsString()
  profile_picture?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({
    description: 'User subscription ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  subscription?: string;

  @ApiProperty({
    description: 'User stripe ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({
    description: 'Subscription status',
    required: false,
  })
  @IsOptional()
  @IsString()
  subscriptionStatus?: string;
}
