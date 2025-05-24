import { IsEnum, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from 'src/schemas/user.schema';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindUsersDto {
  @ApiPropertyOptional({
    enum: ['user', 'admin', 'lawyer'],
    description: 'Filter users by role',
    example: 'lawyer',
  })
  @IsOptional()
  @IsEnum(['user', 'admin', 'lawyer'])
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Text search on email or, for lawyers, on profile fields',
    example: 'ivan',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number (starting from 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (max 100)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit: number = 10;
}
