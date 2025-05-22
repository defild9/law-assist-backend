import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { ConversationModule } from './conversation/conversation.module';
import { VectorStoreModule } from './vector-store/vector-store.module';
import { LlmModule } from './llm/llm.module';
import { MessageModule } from './message/message.module';
import { BotsModule } from './bots/bots.module';
import configuration from './config/configuration';
import { SubscriptionModule } from './subscription/subscription.module';
import { SubscriptionPlanModule } from './subscription-plan/subscription-plan.module';
import { VideoConsultationModule } from './video-consultation/video-consultation.module';
import { LawyerProfileModule } from './lawyer-profile/lawyer-profile.module';
import { TemplateModule } from './template/template.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('databaseUrl'),
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    MailModule,
    ConversationModule,
    VectorStoreModule,
    LlmModule,
    MessageModule,
    SubscriptionModule,
    SubscriptionPlanModule,
    BotsModule,
    VideoConsultationModule,
    LawyerProfileModule,
    TemplateModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
