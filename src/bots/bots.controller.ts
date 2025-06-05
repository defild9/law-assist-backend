import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BotsService } from './bots.service';
import { CreateBotDto } from './dto/create-bot.dto';
import { Bot } from 'src/schemas/bot.schema';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';

@ApiTags('bots')
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
@Controller('bots')
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Post()
  @Roles('admin', 'lawyer')
  @ApiOperation({ summary: 'Create a new bot' })
  @ApiResponse({
    status: 201,
    description: 'Bot has been successfully created',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createBot(
    @Body() createBotDto: CreateBotDto,
  ): Promise<{ status: string; bot: Bot }> {
    const bot = await this.botsService.createBot(createBotDto);
    return { status: 'success', bot };
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve all bots with optional search and filter',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name or description',
  })
  @ApiQuery({
    name: 'collection',
    required: false,
    description: 'Filter by chromaCollection',
  })
  @ApiResponse({ status: 200, description: 'List of bots' })
  async getBots(
    @Query('search') search?: string,
    @Query('collection') collection?: string,
  ): Promise<{ status: string; bots: Bot[] }> {
    const bots = await this.botsService.getBots(search, collection);
    return { status: 'success', bots };
  }

  @Put(':id')
  @Roles('admin', 'lawyer')
  @ApiOperation({ summary: 'Update an existing bot by ID' })
  @ApiParam({ name: 'id', description: 'Bot ID', type: String })
  @ApiBody({ type: CreateBotDto })
  @ApiResponse({ status: 200, description: 'Bot updated successfully' })
  @ApiResponse({ status: 404, description: 'Bot not found' })
  async updateBot(
    @Param('id') id: string,
    @Body() updateBotDto: CreateBotDto,
  ): Promise<{ status: string; bot: Bot }> {
    const updated = await this.botsService.updateBotById(id, updateBotDto);
    if (!updated) {
      throw new NotFoundException(`Bot with ID "${id}" not found`);
    }
    return { status: 'success', bot: updated };
  }

  @Delete(':id')
  @Roles('admin', 'lawyer')
  @ApiOperation({ summary: 'Delete a bot by ID' })
  @ApiParam({ name: 'id', description: 'Bot ID', type: String })
  @ApiResponse({ status: 200, description: 'Bot deleted successfully' })
  @ApiResponse({ status: 404, description: 'Bot not found' })
  async deleteBot(
    @Param('id') id: string,
  ): Promise<{ status: string; bot: Bot }> {
    const deleted = await this.botsService.deleteBotById(id);
    if (!deleted) {
      throw new NotFoundException(`Bot with ID "${id}" not found`);
    }
    return { status: 'success', bot: deleted };
  }
}
