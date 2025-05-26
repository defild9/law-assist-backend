import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { SubscriptionStatus } from 'src/schemas/subscription.schema';

export class UpdateSubscriptionDto {
  @ApiProperty({
    description: 'Subscription plan ID',
    required: false,
    example: '60d21b4667d0d8992e610c85',
  })
  @IsMongoId()
  @IsOptional()
  plan?: string;

  @ApiProperty({
    description: 'Subscription status',
    enum: ['active', 'canceled', 'paused', 'expired'],
    required: false,
  })
  @IsEnum(['active', 'canceled', 'paused', 'expired'])
  @IsOptional()
  status?: SubscriptionStatus;

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
