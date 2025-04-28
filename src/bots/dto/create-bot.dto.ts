import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateBotDto {
  @ApiProperty({
    example: 'lawyer-bot',
    description: 'Unique bot name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'family-lawyer-collection',
    description: 'Name of the ChromaDB collection',
  })
  @IsString()
  @IsNotEmpty()
  chromaCollection: string;

  @ApiProperty({
    example: 'Bot for family lawyer problems consultations',
    description: 'Optional description of the bot',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
