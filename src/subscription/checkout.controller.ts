import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import Stripe from 'stripe';
import { CheckoutDto, CheckoutResponseDto } from './dto/checkout.dto';
import { UserService } from 'src/user/user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { SubscriptionPlanService } from 'src/subscription-plan/subscription-plan.service';

@ApiTags('subscription')
@ApiBearerAuth()
@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-04-30.basil',
  });

  // Update the constructor
  constructor(
    private readonly userService: UserService,
    private readonly subscriptionPlanService: SubscriptionPlanService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a checkout session for subscription' })
  @ApiResponse({
    status: 200,
    description: 'Checkout session created successfully',
    type: CheckoutResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCheckoutSession(
    @Req() req,
    @Body() checkoutDto: CheckoutDto,
  ): Promise<CheckoutResponseDto> {
    const userId = req.user.userId;
    const { planId } = checkoutDto;

    const plan = await this.subscriptionPlanService.findOne(planId);

    if (!plan.stripePriceId) {
      throw new Error('This plan does not have a valid Stripe price ID.');
    }

    const user = await this.userService.findById(userId);

    if (!user) {
      throw new Error('User not found.');
    }

    let customerId = user.customerId;

    if (!user.customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
      });
      customerId = customer.id;

      await this.userService.updateUser(userId, {
        customerId: customerId.toString(),
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId.toString(),
      customer_update: { address: 'auto' },
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      cancel_url: `${process.env.BASE_URL}/pricing/`,
      success_url: `${process.env.BASE_URL}/pricing/success`,
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  }
}
