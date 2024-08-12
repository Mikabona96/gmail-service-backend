import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MessagesModule } from './messages/messages.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RefreshTokenInterceptor } from './common/interceptors/googleTokens.interceptor';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [AuthModule, ConfigModule.forRoot(), MessagesModule, AiModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RefreshTokenInterceptor,
    },
  ],
})
export class AppModule {}
