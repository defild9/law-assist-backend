import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsOptional,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Subscription plan ID',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsMongoId()
  plan: string;

  @ApiProperty({
    description: 'Subscription start date (ISO string)',
    type: String,
    required: false,
    example: '2025-05-07T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string | Date;

  @ApiProperty({
    description: 'Subscription end date (ISO string)',
    type: String,
    required: false,
    example: '2025-06-07T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string | Date;

  @ApiProperty({
    description: 'Whether the subscription should auto-renew',
    default: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}
