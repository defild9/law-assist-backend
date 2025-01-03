import { UserRole } from 'src/schemas/user.schema';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};
