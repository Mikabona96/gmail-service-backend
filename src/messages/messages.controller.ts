import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Tokens } from 'src/common/decorators/cookie-tokens';
import { VerifyAccessTokenService } from 'src/common/providers/verifyAccessToken.service';
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

    const verifyATService = new VerifyAccessTokenService(access_token);
    const verified = await verifyATService.verifyAccessToken();
    if (verified) {
      return await this.messagesService.getMessages(access_token, {
        labelIds: (category && [category.toUpperCase()]) || [],
        pageToken: page || '',
      });
    } else {
      throw new UnauthorizedException('Please refresh access_token!');
    }
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

  @Get('to-spam') //+ send message to spam!
  async toSpamMessage(
    @Tokens('access_token') access_token: string,
    @Query() query: MessageIdSearchParamDto,
  ) {
    const { id } = query;
    return await this.messagesService.toSpamMessage(access_token, id as string);
  }

  @Get('to-unread') //+ send message to spam!
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

  @Get('send/message')
  async sendMessage(@Tokens('access_token') access_token: string) {
    return await this.messagesService.sendMessage(access_token);
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
    const verifyATService = new VerifyAccessTokenService(access_token);
    const verified = await verifyATService.verifyAccessToken();
    if (verified) {
      return await this.messagesService.sendReply(
        access_token,
        text,
        messageId,
      );
    } else {
      throw new UnauthorizedException('Please refresh access_token!');
    }
  }

  @Get('error')
  errorMessage() {
    throw new UnauthorizedException('Please sign in!');
  }
}
