import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Param,
  Query,
  UseGuards,
  NotFoundException,
  Delete,
} from '@nestjs/common';
import { Response } from 'express';
import { LlmService } from 'src/llm/llm.service';
import { SendRequestDto } from './dto/send-request.dto';
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { MessageService } from 'src/message/message.service';
import { Types } from 'mongoose';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { User } from 'src/common/decorators/user.decorator';
import { ConversationService } from './conversation.service';

@ApiTags('Conversation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('conversation')
export class ConversationController {
  constructor(
    private readonly llmService: LlmService,
    private readonly messageService: MessageService,
    private readonly conversationService: ConversationService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Search conversations by message content' })
  @ApiQuery({
    name: 'query',
    description: 'Search string for message content',
    required: true,
    type: String,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination (default: 1)',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of items per page (default: 10)',
    required: false,
    type: Number,
  })
  async searchConversations(
    @User('userId') userId: string,
    @Query('query') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    if (!query) {
      throw new NotFoundException('Query parameter is required');
    }

    console.log(userId);
    return this.conversationService.searchConversationByMessageContent(
      userId,
      query,
      page,
      limit,
    );
  }

  @Get(':conversationId')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiResponse({ status: 200, description: 'Returns conversation data' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async getConversation(
    @User('userId') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    try {
      const conversation = await this.conversationService.getConversationById(
        conversationId,
        userId,
      );
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
      return conversation;
    } catch (error) {
      return { error: error.message };
    }
  }

  @Post()
  @ApiOperation({ summary: 'Send a request to LLM with custom data' })
  @ApiBody({
    type: SendRequestDto,
    description:
      'Request data. The request body should include the "prompt" field containing the query string.',
  })
  @ApiResponse({
    status: 200,
    description: 'Response as a data stream (Server-Sent Events)',
    content: {
      'text/event-stream': {
        schema: { type: 'string', example: 'data: Your response\n\n' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async stream(
    @User('userId') userId: string,
    @Body() body: SendRequestDto,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const conversation = body.chatId
        ? ((await this.conversationService.findById(body.chatId, userId)) ??
          (await this.conversationService.createConversation(userId)))
        : await this.conversationService.createConversation(userId);

      const lastMessage = await this.messageService.getLastMessage(
        conversation._id as Types.ObjectId,
      );
      const userMessage = await this.messageService.create({
        chatId: conversation._id as Types.ObjectId,
        role: 'user',
        content: body.prompt,
        parentId: (lastMessage?._id as Types.ObjectId) || new Types.ObjectId(),
      });

      let fullBotResponse = '';
      const stream = this.llmService.generateStream(body.prompt);

      for await (const chunk of stream) {
        res.write(
          `data: ${JSON.stringify({
            content: chunk,
            chatId: conversation.id,
          })}\n\n`,
        );
        fullBotResponse += chunk;
      }

      const assistantMessage = await this.messageService.create({
        chatId: conversation._id as Types.ObjectId,
        role: 'assistant',
        content: fullBotResponse,
        parentId: userMessage._id as Types.ObjectId,
      });

      await this.messageService.addChild(
        userMessage._id as Types.ObjectId,
        assistantMessage._id as Types.ObjectId,
      );
      await this.conversationService.addMessages(
        conversation._id as Types.ObjectId,
        [
          userMessage._id as Types.ObjectId,
          assistantMessage._id as Types.ObjectId,
        ],
      );

      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of user conversations',
  })
  async getUserConversations(
    @User('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.conversationService.getUserConversations(userId, page, limit);
  }

  @Delete(':conversationId')
  @ApiOperation({ summary: 'Delete a conversation and its messages' })
  @ApiResponse({
    status: 200,
    description:
      'Conversation and its messages were successfully deleted. Returns an object with success flag and a message.',
    schema: {
      example: {
        success: true,
        message: 'Conversation and its messages were successfully deleted',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async deleteConversation(
    @User('userId') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return await this.conversationService.deleteConversation(
      conversationId,
      userId,
    );
  }
}
