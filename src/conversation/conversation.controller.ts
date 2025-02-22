import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { LlmService } from 'src/llm/llm.service';
import { SendRequestDto } from './dto/send-request.dto';
import { ApiOperation, ApiTags, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Conversation')
@Controller('conversation')
export class ConversationController {
  constructor(private readonly llmService: LlmService) {}

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
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async stream(@Body() body: SendRequestDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const stream = this.llmService.generateStream(body.prompt);

      for await (const chunk of stream) {
        res.write(`data: ${chunk}\n\n`);
      }
    } catch (error) {
      res.write(`data: Error: ${error.message}\n\n`);
    } finally {
      res.end();
    }
  }
}
