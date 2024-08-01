import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
// import { Tokens } from 'src/common/decorators/cookie-tokens';
import { RefreshTokenInterceptor } from 'src/common/interceptors/googleTokens.interceptor';
import { Request } from 'express';
import { VerifyAccessTokenService } from 'src/common/providers/verifyAccessToken.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}
  @Get('list')
  @UseInterceptors(RefreshTokenInterceptor)
  async getMessages(@Req() req: Request) {
    const access_token = req.cookies['access_token'];
    const verifyATService = new VerifyAccessTokenService(access_token);
    const verified = await verifyATService.verifyAccessToken();
    if (verified) {
      return await this.messagesService.getMessages(access_token);
    } else {
      throw new UnauthorizedException('Please refresh access_token!');
    }
  }
  @Get('error')
  errorMessage() {
    throw new UnauthorizedException('Please sign in!');
  }
}
