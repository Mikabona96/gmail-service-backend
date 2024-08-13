import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { VerifyAccessTokenService } from 'src/common/providers/verifyAccessToken.service';
import { GenerateAccessTokenService } from 'src/common/providers/generateAccessToken.service';

@Module({
  controllers: [MessagesController],
  providers: [
    MessagesService,
    VerifyAccessTokenService,
    GenerateAccessTokenService,
  ],
})
export class MessagesModule {}
