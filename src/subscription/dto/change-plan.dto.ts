import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { SubscriptionPlan } from 'src/schemas/subscription.schema';

export class ChangePlanDto {
  @ApiProperty({
    enum: ['free', 'basic', 'premium', 'enterprise'],
  })
  @IsEnum(['free', 'basic', 'premium', 'enterprise'])
  @IsNotEmpty()
  plan: SubscriptionPlan;
}
