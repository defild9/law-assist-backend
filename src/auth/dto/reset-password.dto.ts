import {
  IsNotEmpty,
  IsStrongPassword,
  Length,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token for resetting the password received via email',
    example: '2f82f072d7d61974f88f7460a4bf294e1e405ae9bc2e01093048e8ece0c4f85e',
  })
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: "User's new password",
    example: 'newStrongPassword123@',
  })
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must contain at least 8 characters' })
  @IsStrongPassword()
  @Length(8, 100)
  newPassword: string;
}
