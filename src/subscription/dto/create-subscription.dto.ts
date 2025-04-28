import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { SubscriptionPlan } from 'src/schemas/subscription.schema';

export class CreateSubscriptionDto {
  @ApiProperty({
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free',
  })
  @IsEnum(['free', 'basic', 'premium', 'enterprise'])
  plan: SubscriptionPlan;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @ApiProperty({ default: true, required: false })
  @IsOptional()
  autoRenew?: boolean;
}
