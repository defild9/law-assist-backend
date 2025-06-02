import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/schemas/user.schema';
import { randomBytes } from 'crypto';
import { MailService } from 'src/mail/mail.service';
import { use } from 'passport';
import { CreateUserDto } from 'src/user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user._id, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRATION,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRATION,
      }),
    ]);

    await this.userService.updateRefreshToken(
      user._id.toString(),
      refreshToken,
    );

    const userObj = user.toObject();
    const { password, ...userWithoutPassword } = userObj;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(user: { userId: string; email: string; role: string }) {
    const payload = { sub: user.userId, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRATION,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRATION,
      }),
    ]);

    await this.userService.updateRefreshToken(user.userId, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }

  async sendResetPasswordLink(email: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const verificationToken = randomBytes(32).toString('hex');

    user.verificationToken = verificationToken;

    user.save();

    try {
      await this.mailService.sendResetPasswordEmail(email, verificationToken);
      return {
        message: 'The password reset link has been sent to your email.',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to send the password reset link.',
      );
    }
  }

  async logout(userId: string) {
    await this.userService.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  async validateGoogleUser(googleUser: CreateUserDto) {
    const user = await this.userService.findByEmail(googleUser.email);
    if (user) return true;
    return this.userService.createUser(googleUser);
  }
  async handleGoogleAuth(user: CreateUserDto): Promise<string> {
    const existingUser = await this.userService.findByEmail(user.email ?? '');

    if (existingUser) {
      const { accessToken } = await this.login(existingUser);
      return accessToken;
    } else {
      const createdUser = await this.userService.createUser({
        email: user.email ?? '',
        isOAuthRegister: true,
        profile_picture: user.profile_picture,
        password: '',
      });

      const payload = {
        email: createdUser.email,
        sub: createdUser._id,
        role: createdUser.role,
      };
      const [accessToken] = await this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRATION,
      });
      return accessToken;
    }
  }
}
