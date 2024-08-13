import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { MessagesModule } from './messages/messages.module';
// import { APP_INTERCEPTOR } from '@nestjs/core';
// import { RefreshTokenInterceptor } from './common/interceptors/googleTokens.interceptor';
import { AiModule } from './ai/ai.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './guards/auth.guard';
import { GenerateAccessTokenService } from './common/providers/generateAccessToken.service';
import { VerifyAccessTokenService } from './common/providers/verifyAccessToken.service';

@Module({
  imports: [AuthModule, ConfigModule.forRoot(), MessagesModule, AiModule],
  controllers: [AppController],
  providers: [
    AppService,
    GenerateAccessTokenService,
    VerifyAccessTokenService,
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: RefreshTokenInterceptor,
    // },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
