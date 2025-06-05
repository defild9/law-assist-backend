import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

import { LawyerProfileService } from './lawyer-profile.service';
import { LawyerProfile } from 'src/schemas/lawyer-profile.schema';
import { CreateLawyerProfileDto } from './dto/ create-lawyer-profile.dto';
import { UpdateLawyerProfileDto } from './dto/update-lawyer-profile.dto';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';

@ApiTags('Lawyer Profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Controller('lawyer/profile')
export class LawyerProfileController {
  constructor(private readonly svc: LawyerProfileService) {}

  @ApiOperation({ summary: 'Create or overwrite lawyer profile' })
  @Roles('admin')
  @ApiBody({ type: CreateLawyerProfileDto })
  @ApiResponse({
    status: 201,
    description: 'Profile created',
    type: LawyerProfile,
  })
  @Post()
  async create(@Req() req, @Body() dto: CreateLawyerProfileDto) {
    return this.svc.create(dto.userId ? dto.userId : req.user.userId, dto);
  }

  @ApiOperation({ summary: 'Get current lawyer profile' })
  @ApiResponse({
    status: 200,
    description: 'Existing profile',
    type: LawyerProfile,
  })
  @Roles('admin')
  @Get()
  async getProfile(@Req() req) {
    return this.svc.findByUser(req.user.userId);
  }

  @ApiOperation({ summary: 'Update existing lawyer profile' })
  @ApiBody({ type: UpdateLawyerProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    type: LawyerProfile,
  })
  @Roles('admin')
  @Put()
  async update(@Req() req, @Body() dto: UpdateLawyerProfileDto) {
    return this.svc.update(dto.userId ? dto.userId : req.user.userId, dto);
  }
}
