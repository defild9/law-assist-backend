import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class ChangePlanDto {
  @ApiProperty({
    description: 'New subscription plan ID',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsMongoId()
  plan: string;
}
