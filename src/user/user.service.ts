import {
  ConflictException,
  Injectable,
  NotFoundException,
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
    this.saltRounds = this.configService.get<number>('saltRounds');
  }

  async createUser(createUserDto: CreateUserDto) {
    const existingUser = await this.userModel
      .findOne({ email: createUserDto.email })
      .exec();

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const hashedPasswords = await bcrypt.hash(
      createUserDto.password,
      this.saltRounds,
    );

    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPasswords,
    });

    return newUser.save();
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
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
    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userModel.deleteOne({ _id: userId }).exec();
  }
}
