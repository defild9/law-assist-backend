import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  HttpStatus,
  Patch,
  Get,
  HttpCode,
  Redirect,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleOauthGuard } from './guards/google-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: 'User registration' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string' },
        password: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully.',
  })
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Request() req) {
    return this.authService.refreshTokens(req.user);
  }

  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({ status: 200, description: 'User successfully logged out.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req) {
    const userId = req.user.userId;
    return this.authService.logout(userId);
  }

  @ApiOperation({ summary: 'User verify email' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
      },
    },
  })
  @Post('verify-email')
  async verifyEmail(@Body('token') token: string) {
    return await this.userService.verifyUserByEmail(token);
  }

  @ApiOperation({ summary: 'Send reset password link' })
  @ApiBody({ type: ForgotPasswordDto })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    console.log(forgotPasswordDto);
    return this.authService.sendResetPasswordLink(forgotPasswordDto.email);
  }

  @ApiOperation({ summary: 'Reset password' })
  @ApiBody({ type: ResetPasswordDto })
  @Patch('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.userService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @ApiOkResponse({
    description: 'Google auth',
    type: Boolean,
  })
  @HttpCode(HttpStatus.OK)
  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async googleAuth() {}

  @ApiOkResponse({
    description: 'Google',
    type: Boolean,
  })
  @HttpCode(HttpStatus.OK)
  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  @Redirect()
  async googleAuthReturn(@Req() req: Request & { user: CreateUserDto }) {
    await this.authService.handleGoogleAuth(req.user);
    return { url: process.env.FRONT_URL };
  }
}
