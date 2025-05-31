import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserService } from '../user/user.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let userService: UserService;

  const mockAuthService = {
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    sendResetPasswordLink: jest.fn(),
  };

  const mockUserService = {
    createUser: jest.fn(),
    verifyUserByEmail: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    authController = moduleRef.get<AuthController>(AuthController);
    authService = moduleRef.get<AuthService>(AuthService);
    userService = moduleRef.get<UserService>(UserService);
  });

  describe('register', () => {
    it('should call userService.createUser with correct data', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      await authController.register(dto);
      expect(userService.createUser).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should return authService.login result', async () => {
      const mockUser = { id: 1, email: 'user@test.com' };
      const req = { user: mockUser };
      const result = { accessToken: 'abc', refreshToken: 'def' };
      mockAuthService.login.mockResolvedValue(result);

      const response = await authController.login(req);
      expect(response).toEqual(result);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('refresh', () => {
    it('should call authService.refreshTokens with req.user', async () => {
      const req = { user: { id: 2 } };
      const result = { accessToken: 'newToken' };
      mockAuthService.refreshTokens.mockResolvedValue(result);

      const response = await authController.refresh(req);
      expect(response).toEqual(result);
      expect(authService.refreshTokens).toHaveBeenCalledWith(req.user);
    });
  });

  describe('logout', () => {
    it('should call authService.logout with userId', async () => {
      const req = { user: { userId: 3 } };
      await authController.logout(req);
      expect(authService.logout).toHaveBeenCalledWith(3);
    });
  });

  describe('verifyEmail', () => {
    it('should call userService.verifyUserByEmail with token', async () => {
      const token = 'verification-token';
      await authController.verifyEmail(token);
      expect(userService.verifyUserByEmail).toHaveBeenCalledWith(token);
    });
  });

  describe('forgotPassword', () => {
    it('should call authService.sendResetPasswordLink with email', async () => {
      const dto: ForgotPasswordDto = { email: 'reset@test.com' };
      await authController.forgotPassword(dto);
      expect(authService.sendResetPasswordLink).toHaveBeenCalledWith(dto.email);
    });
  });

  describe('resetPassword', () => {
    it('should call userService.resetPassword with token and newPassword', async () => {
      const dto: ResetPasswordDto = {
        token: 'reset-token',
        newPassword: 'newPass123',
      };
      await authController.resetPassword(dto);
      expect(userService.resetPassword).toHaveBeenCalledWith(
        dto.token,
        dto.newPassword,
      );
    });
  });
});
