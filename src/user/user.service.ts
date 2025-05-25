import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  GoneException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserRole } from 'src/schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UpdateUserDto } from './dto/update-user.dto';
import { MailService } from 'src/mail/mail.service';
import { randomBytes } from 'crypto';

@Injectable()
export class UserService {
  private readonly saltRounds: number;

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private configService: ConfigService,
    private mailService: MailService,
  ) {
    this.saltRounds = this.configService.get<number>('saltRounds') || 10;
  }

  async findByEmail(email: string): Promise<User> {
    if (!email) {
      throw new BadRequestException('Email must be provided');
    }
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('User not found with the provided email');
    }
    return user;
  }

  async createUser(createUserDto: CreateUserDto): Promise<Partial<User>> {
    if (!createUserDto.email || !createUserDto.password) {
      throw new BadRequestException('Email and password are required');
    }

    const existingUser = await this.userModel
      .findOne({ email: createUserDto.email })
      .exec();

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      this.saltRounds,
    );

    const verificationToken = randomBytes(32).toString('hex');

    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      verificationToken,
      isVerified: false,
    });

    const savedUser = await newUser.save();

    await this.mailService.sendVerificationEmail(
      savedUser.email,
      verificationToken,
    );

    const { password, ...userWithoutPassword } = savedUser.toObject();
    return userWithoutPassword;
  }

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided');
    }

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await this.userModel
        .findOne({ email: updateUserDto.email })
        .exec();
      if (emailExists) {
        throw new ConflictException('Email is already in use');
      }
    }

    await this.userModel.findByIdAndUpdate(userId, updateUserDto).exec();
    return this.userModel.findById(userId).select('-password').exec();
  }

  async deleteUser(userId: string): Promise<void> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided');
    }

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userModel.deleteOne({ _id: userId }).exec();
  }

  async findById(id: string): Promise<User> {
    if (!id) {
      throw new BadRequestException('User ID must be provided');
    }

    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.toObject();
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    if (!userId) {
      throw new BadRequestException('User ID must be provided');
    }
    if (!refreshToken) {
      throw new BadRequestException('Refresh token must be provided');
    }

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userModel.findByIdAndUpdate(userId, { refreshToken }).exec();
  }

  async findByVerificationToken(token: string) {
    return this.userModel.findOne({ verificationToken: token });
  }

  async verifyUserByEmail(token: string) {
    const user = await this.findByVerificationToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    if (user.isEmailVerified) {
      throw new GoneException('Email has already been verified.');
    }

    user.isEmailVerified = true;
    user.verificationToken = null;
    await user.save();

    return {
      statusCode: HttpStatus.OK,
      message: 'Email successfully verified.',
    };
  }
  async resetPassword(token: string, newPassword: string) {
    try {
      const user = await this.findByVerificationToken(token);

      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired token.',
        };
      }

      const newHashedPassword = await bcrypt.hash(newPassword, this.saltRounds);

      user.password = newHashedPassword;
      user.verificationToken = null;

      await user.save();

      return {
        success: true,
        message: 'Password successfully changed.',
      };
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred while verifying email.',
      };
    }
  }
  async findByRole(role: UserRole): Promise<User[]> {
    return this.userModel
      .find({ role })
      .populate({
        path: 'lawyerProfile',
        model: 'LawyerProfile',
        select: '-__v -user',
      })
      .exec();
  }

  async findByStripeCustomerId(customerId: string): Promise<User> {
    if (!customerId) {
      throw new BadRequestException('Stripe customer ID must be provided');
    }

    const user = await this.userModel
      .findOne({ subscription: customerId })
      .exec();
    if (!user) {
      throw new NotFoundException(
        `User not found with Stripe customer ID: ${customerId}`,
      );
    }

    return user;
  }
}
