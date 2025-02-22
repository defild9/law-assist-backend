import { ApiProperty } from '@nestjs/swagger';

export class SendRequestDto {
  @ApiProperty({
    example: 'Hello, how are you?',
    description: 'The prompt for the LLM to process',
  })
  prompt: string;
}
