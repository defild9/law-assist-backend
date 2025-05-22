import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTemplateDto {
  @ApiProperty({ example: 'Contract NDA' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'This is a non-disclosure agreement template',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '## NDA\nThis is the markdown content...',
    type: 'string',
  })
  @IsString()
  content: string;

  @ApiProperty({ example: 'Confidentiality', required: false })
  @IsOptional()
  @IsString()
  category?: string;
}
