import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsBoolean } from 'class-validator';
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from 'src/schemas/subscription.schema';

export class UpdateSubscriptionDto {
  @ApiProperty({
    enum: ['free', 'basic', 'premium', 'enterprise'],
    required: false,
  })
  @IsEnum(['free', 'basic', 'premium', 'enterprise'])
  @IsOptional()
  plan?: SubscriptionPlan;

  @ApiProperty({
    enum: ['active', 'canceled', 'paused', 'expired'],
    required: false,
  })
  @IsEnum(['active', 'canceled', 'paused', 'expired'])
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}
