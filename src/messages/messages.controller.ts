import { Controller, Get, Req, UseInterceptors } from '@nestjs/common';
import { MessagesService } from './messages.service';
// import { Tokens } from 'src/common/decorators/cookie-tokens';
import { RefreshTokenInterceptor } from 'src/common/interceptors/googleTokens.interceptor';
import { Request } from 'express';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}
  @Get('list')
  @UseInterceptors(RefreshTokenInterceptor)
  async getMessages(@Req() req: Request) {
    const access_token = req.cookies['access_token'];
    return this.messagesService.getMessages(access_token);
  }
  @Get('error')
  errorMessage() {
    return 'something went wrong... try to update your tokens';
  }
}
