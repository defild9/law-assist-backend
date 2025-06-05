import {
  Body,
  Post,
  Controller,
  HttpException,
  HttpStatus,
  ConflictException,
  NotFoundException,
  Param,
  Patch,
  Delete,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  DefaultValuePipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { put } from '@vercel/blob';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { User } from 'src/common/decorators/user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import multer, { memoryStorage } from 'multer';
import { UserRole } from 'src/schemas/user.schema';
import { FindUsersDto } from './dto/find-users.dto';
import { ChangeUserRoleDto } from './dto/change-user-role.dto';
import { DeleteUserDto } from './dto/delete-user.dto';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';

@ApiTags('user')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({
    summary: 'Get a paginated list of users with optional filters',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['user', 'admin', 'lawyer'],
    description: 'Filter by user role',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for email or lawyer profile',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  async findAll(@Query() query: FindUsersDto) {
    return this.userService.findAll(query);
  }

  @Patch(':id/change-role')
  @Roles('admin')
  @ApiOperation({ summary: 'Change a user’s role' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBadRequestResponse({ description: 'Missing or invalid parameters' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async changeRole(@Param('id') id: string, @Body() dto: ChangeUserRoleDto) {
    return this.userService.changeUserRole(id, dto.role);
  }

  @Patch()
  @UseInterceptors(
    FileInterceptor('profile_picture', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Update an existing user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email is already in use' })
  @ApiResponse({ status: 500, description: 'Failed to update user' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profile_picture: {
          type: 'string',
          format: 'binary',
          description: 'Файл фото профиля',
        },
        email: { type: 'string', example: 'user@example.com' },
      },
    },
  })
  async updateUser(
    @User('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      if (file) {
        const key = `users/${userId}/${Date.now()}_${file.originalname}`;

        const { url } = await put(key, file.buffer, {
          contentType: file.mimetype,
          access: 'public',
        });
        updateUserDto.profile_picture = url;
      }
      const updatedUser = await this.userService.updateUser(
        userId,
        updateUserDto,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'User updated successfully',
        data: updatedUser,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      } else if (error instanceof ConflictException) {
        throw new HttpException('Email is already in use', HttpStatus.CONFLICT);
      }

      throw new HttpException(
        'Failed to update user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(
    @User('userId') userId: string,
    @Body() deleteUserDto?: DeleteUserDto,
  ) {
    try {
      await this.userService.deleteUser(
        deleteUserDto.userId ? deleteUserDto.userId : userId,
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'User deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Failed to delete user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
