import { SetMetadata } from '@nestjs/common';

export const SubscriptionPlan = (plan: string) =>
  SetMetadata('subscriptionPlan', plan);
