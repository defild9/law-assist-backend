import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/schemas/user.schema';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
