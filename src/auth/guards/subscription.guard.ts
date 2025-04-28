import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionService } from 'src/subscription/subscription.service';
import { UserService } from 'src/user/user.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
    private subscriptionService: SubscriptionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPlan = this.reflector.get<string>(
      'subscriptionPlan',
      context.getHandler(),
    );

    if (!requiredPlan) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const subscription = await this.subscriptionService.findActiveSubscription(
      user._id,
    );

    if (!subscription) {
      return false;
    }

    return this.checkPlan(subscription.plan, requiredPlan);
  }

  private checkPlan(userPlan: string, requiredPlan: string): boolean {
    const planHierarchy = {
      free: 0,
      basic: 1,
      premium: 2,
      enterprise: 3,
    };

    return planHierarchy[userPlan] >= planHierarchy[requiredPlan];
  }
}
