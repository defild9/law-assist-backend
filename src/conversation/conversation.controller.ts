import {
  Controller,
  Post,
  Body,
  Res,
  Get,
  Param,
  UseGuards,
  NotFoundException,
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

      const stream = this.llmService.generateStream(
        conversation._id as Types.ObjectId,
        body.prompt,
      );

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
}
