import {
  Controller,
  Get,
  Query,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Tokens } from 'src/common/decorators/cookie-tokens';
import { RefreshTokenInterceptor } from 'src/common/interceptors/googleTokens.interceptor';
import { VerifyAccessTokenService } from 'src/common/providers/verifyAccessToken.service';
import { MessagesSearchParamsDto } from './dto/search-params.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}
  @Get('list')
  @UseInterceptors(RefreshTokenInterceptor)
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
  @Get('error')
  errorMessage() {
    throw new UnauthorizedException('Please sign in!');
  }
}
