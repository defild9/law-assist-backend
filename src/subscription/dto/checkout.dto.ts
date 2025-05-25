import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CheckoutDto {
  @ApiProperty({
    description: 'The subscription plan ID',
    example: '60d21b4667d0d8992e610c85',
  })
  @IsMongoId()
  planId: string;
}

export class CheckoutResponseDto {
  @ApiProperty({
    description: 'The Stripe checkout session ID',
    example: 'cs_test_1234567890',
  })
  sessionId: string;

  @ApiProperty({
    description: 'The URL to redirect the user to for payment',
    example: 'https://checkout.stripe.com/pay/cs_test_1234567890',
  })
  url: string;
}
