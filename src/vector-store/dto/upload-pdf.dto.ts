import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadPdfDto {
  @ApiProperty({
    example: 'bot-data',
    description: 'The name of the collection which need add file',
  })
  @IsNotEmpty()
  @IsString()
  collectionName: string;
}
