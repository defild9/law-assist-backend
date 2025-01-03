import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  private readonly saltRounds: number;

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private configService: ConfigService,
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

    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

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
    return user;
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
}
