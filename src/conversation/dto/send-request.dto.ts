import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsMongoId } from 'class-validator';

export class SendRequestDto {
  @ApiProperty({
    example: 'Hello, how are you?',
    description: 'The prompt for the LLM to process',
  })
  prompt: string;

  // @IsMongoId()
  @IsOptional()
  @ApiProperty({
    example: '67bf15094193826f4efa026b',
    description: 'The id of chat',
    required: false,
  })
  chatId?: string;

  @ApiProperty({
    example: 'default-model',
    description: 'This is name of model which you want to use',
  })
  @IsOptional()
  model?: string;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    required: false,
    description: 'Images or PDF files',
  })
  @IsOptional()
  files?: any;
}
