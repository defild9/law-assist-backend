import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCollectionDto {
  @ApiProperty({
    example: 'bot-data',
    description: 'The name of the collection to be created',
  })
  @IsNotEmpty()
  @IsString()
  collectionName: string;
}
