import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
} from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({
    description: 'Unique name of the subscription plan',
    example: 'basic',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Price of the plan in USD (e.g. 9.99)',
    example: 9.99,
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Plan description',
    example: 'Access to basic features for small teams',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'List of features included in this plan',
    example: ['featureA', 'featureB'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  features: string[];

  @ApiProperty({
    description: 'Optional trial period duration in days',
    example: 14,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  trialPeriodDays?: number;
}
