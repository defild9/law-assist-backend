import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsMongoId } from 'class-validator';

export class SendRequestDto {
  @ApiProperty({
    example: 'Hello, how are you?',
    description: 'The prompt for the LLM to process',
  })
  prompt: string;

  @IsOptional()
  @IsMongoId()
  @ApiProperty({
    example: '67bf15094193826f4efa026b',
    description: 'The id of chat',
  })
  chatId?: string;

  @ApiProperty({
    example: 'default-model',
    description: 'This is name of model which you want to use',
  })
  @IsOptional()
  model?: string;
}
