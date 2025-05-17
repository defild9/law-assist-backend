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

@ApiTags('Lawyer Profile')
@ApiBearerAuth()
@Controller('lawyer/profile')
export class LawyerProfileController {
  constructor(private readonly svc: LawyerProfileService) {}

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create or overwrite lawyer profile' })
  @ApiBody({ type: CreateLawyerProfileDto })
  @ApiResponse({
    status: 201,
    description: 'Profile created',
    type: LawyerProfile,
  })
  @Post()
  async create(@Req() req, @Body() dto: CreateLawyerProfileDto) {
    return this.svc.create(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current lawyer profile' })
  @ApiResponse({
    status: 200,
    description: 'Existing profile',
    type: LawyerProfile,
  })
  @Get()
  async getProfile(@Req() req) {
    return this.svc.findByUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update existing lawyer profile' })
  @ApiBody({ type: UpdateLawyerProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    type: LawyerProfile,
  })
  @Put()
  async update(@Req() req, @Body() dto: UpdateLawyerProfileDto) {
    return this.svc.update(req.user.userId, dto);
  }
}
