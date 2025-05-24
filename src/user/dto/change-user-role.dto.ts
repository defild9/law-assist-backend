import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from 'src/schemas/user.schema';

export class ChangeUserRoleDto {
  @ApiProperty({
    enum: ['user', 'admin', 'lawyer'],
    description: 'New role for the user',
  })
  @IsEnum(['user', 'admin', 'lawyer'], {
    message: 'Role must be one of user|admin|lawyer',
  })
  @IsNotEmpty()
  role: UserRole;
}
