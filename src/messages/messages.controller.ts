import { Controller, Get } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Tokens } from 'src/common/decorators/cookie-tokens';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}
  @Get('list')
  async getMessages(@Tokens('access_token') access_token: string) {
    return this.messagesService.getMessages(access_token);
  }
}
