import { ApiProperty } from '@nestjs/swagger';

export class ConvertFileDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'DOCX or PDF file',
  })
  file: any;
}
