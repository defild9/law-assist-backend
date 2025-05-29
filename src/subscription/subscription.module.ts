import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubscriptionGuard } from 'src/auth/guards/subscription.guard';
import {
  Subscription,
  SubscriptionSchema,
} from 'src/schemas/subscription.schema';
import { UserModule } from 'src/user/user.module';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { WebhookController } from './webhook.controller';
import { CheckoutController } from './checkout.controller';
import { SubscriptionPlanModule } from 'src/subscription-plan/subscription-plan.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
    UserModule,
    SubscriptionPlanModule,
  ],
  providers: [SubscriptionService, SubscriptionGuard],
  controllers: [SubscriptionController, WebhookController, CheckoutController],
  exports: [SubscriptionService, SubscriptionGuard],
})
export class SubscriptionModule {}
