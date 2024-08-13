import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Tokens } from 'src/common/decorators/cookie-tokens';
import {
  MessageIdSearchParamDto,
  MessagesSearchParamsDto,
} from './dto/search-params.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('list')
  async getMessages(
    @Tokens('access_token') access_token: string,
    @Query() query: MessagesSearchParamsDto,
  ) {
    const { category, page } = query;
    return await this.messagesService.getMessages(access_token, {
      labelIds: (category && [category.toUpperCase()]) || [],
      pageToken: page || '',
    });
  }

  @Get('to-trash') //+ send message to trash not deleting!
  async toTrashMessage(
    @Tokens('access_token') access_token: string,
    @Query() query: MessageIdSearchParamDto,
  ) {
    const { id } = query;
    return await this.messagesService.toTrashMessage(
      access_token,
      id as string,
    );
  }

  @Delete('delete-batch')
  async toTrahBatch(
    @Tokens('access_token') access_token: string,
    @Body()
    body: string[],
  ) {
    return await this.messagesService.toTrashBatch(access_token, body);
  }

  @Get('to-spam')
  async toSpamMessage(
    @Tokens('access_token') access_token: string,
    @Query() query: MessageIdSearchParamDto,
  ) {
    const { id } = query;
    return await this.messagesService.toSpamMessage(access_token, id as string);
  }

  @Get('to-unread')
  async markUnread(
    @Tokens('access_token') access_token: string,
    @Query() query: MessageIdSearchParamDto,
  ) {
    const { id } = query;
    return await this.messagesService.markUnread(access_token, id as string);
  }

  @Get(':id')
  async getMessage(
    @Tokens('access_token') access_token: string,
    @Param() { id }: { id: string },
  ) {
    return await this.messagesService.getMessage(access_token, id as string);
  }
  @Get('attachment/:id')
  async getAttachment(
    @Tokens('access_token') access_token: string,
    @Query() query: MessageIdSearchParamDto,
    @Param() { id }: { id: string },
  ) {
    console.log(id);
    return await this.messagesService.getAttachment(access_token, id, query.id);
  }

  @Post('message/send')
  async sendMessage(
    @Tokens('access_token') access_token: string,
    @Body() body: { to: string; subject: string; message: string },
  ) {
    return await this.messagesService.sendMessage(access_token, body);
  }

  @Post('message/reply')
  async replyMessage(
    @Tokens('access_token') access_token: string,
    @Body()
    body:
      | {
          text: string;
          messageId: string;
        }
      | any,
  ) {
    const { messageId, text } = body;
    return await this.messagesService.sendReply(access_token, text, messageId);
  }

  @Get('thread/:id') //+ send message to spam!
  async getThread(
    @Tokens('access_token') access_token: string,
    @Param() { id }: { id: string },
  ) {
    return this.messagesService.getThread({
      access_token,
      threadId: id,
    });
  }

  @Get('error')
  errorMessage() {
    throw new UnauthorizedException('Please sign in!');
  }
}
