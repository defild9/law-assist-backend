import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateBotDto {
  @ApiPropertyOptional({
    example: 'sales-bot',
    description: 'Unique bot name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({
    example: 'sales-docs-collection',
    description: 'Name of the ChromaDB collection',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  chromaCollection?: string;

  @ApiPropertyOptional({
    example: 'Bot for sales consultations',
    description: 'Optional description of the bot',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
