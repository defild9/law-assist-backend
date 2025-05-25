import { Controller, Post, Req, Res, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { UserService } from '../user/user.service';

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

@Injectable()
@Controller('webhook')
export class WebhookController {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  constructor(private readonly userService: UserService) {}

  @Post()
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    try {
      if (!sig || !webhookSecret) {
        console.log(sig, webhookSecret);
        return res.status(400).send('Webhook secret not found.');
      }

      event = this.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log(`Webhook received: ${event.type}`);
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (relevantEvents.has(event.type)) {
      try {
        switch (event.type) {
          case 'customer.subscription.created':
          case 'customer.subscription.updated':
          case 'customer.subscription.deleted':
            const subscription = event.data.object as Stripe.Subscription;
            await this.manageSubscriptionStatusChange(
              subscription.id,
              subscription.customer as string,
              event.type === 'customer.subscription.created',
            );
            break;
          case 'checkout.session.completed':
            const session = event.data.object as Stripe.Checkout.Session;
            if (session.mode === 'subscription') {
              const subscriptionId = session.subscription as string;
              await this.manageSubscriptionStatusChange(
                subscriptionId,
                session.customer as string,
                true,
              );
            }
            break;
          default:
            console.warn(`Unhandled event type: ${event.type}`);
        }
      } catch (error) {
        console.error(`Webhook handler error: ${error.message}`);
        return res.status(400).send('Webhook handler failed.');
      }
    } else {
      console.warn(`Ignored event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  }

  private async manageSubscriptionStatusChange(
    subscriptionId: string,
    customerId: string,
    isNewSubscription: boolean,
  ): Promise<void> {
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);
    const user = await this.userService.findByStripeCustomerId(customerId);

    if (!user) {
      console.error(`User not found for Stripe customer ID: ${customerId}`);
      return;
    }

    const subscriptionData = {
      id: subscription.id,
      status: subscription.status,
      priceId: subscription.items.data[0].price.id,
      quantity: subscription.items.data[0].quantity,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelAt: subscription.cancel_at
        ? new Date(subscription.cancel_at * 1000)
        : null,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      currentPeriodStart: new Date(subscription.start_date * 1000),
      currentPeriodEnd: new Date(subscription.ended_at * 1000),
      createdAt: new Date(subscription.created * 1000),
      endedAt: subscription.ended_at
        ? new Date(subscription.ended_at * 1000)
        : null,
    };

    await this.userService.updateUser(user.id, {
      subscription: subscriptionData.id,
      subscriptionStatus: subscription.status,
    });
  }
}
