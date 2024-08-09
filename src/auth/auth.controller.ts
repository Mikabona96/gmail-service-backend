import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import {
  Controller,
  Get,
  Request,
  Response,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  Response as ExpressResponse,
  Request as ExpressRequest,
} from 'express';
import { Tokens } from 'src/common/decorators/cookie-tokens';
import { VerifyAccessTokenService } from 'src/common/providers/verifyAccessToken.service';
import { RefreshTokenInterceptor } from 'src/common/interceptors/googleTokens.interceptor';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('hello')
  getHello() {
    return 'Hello!';
  }

  @Get()
  @UseGuards(GoogleOAuthGuard)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async googleAuth(@Request() req) {}

  @Get('google-redirect')
  @UseGuards(GoogleOAuthGuard)
  googleAuthRedirect(
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse,
  ) {
    const user = this.authService.googleLogin(req);

    if (typeof user === 'string') return user;

    res.cookie('access_token', user.user.accessToken, {
      secure: false,
      httpOnly: true,
    });
    if (user.user.refreshToken) {
      res.cookie('refresh_token', user.user.refreshToken, {
        secure: false,
        httpOnly: true,
      });
    }

    res.redirect(
      `${process.env.CLIENT_REDIRECT_URL}?email=${user.user.email}&name=${user.user.firstName}&lastname=${user.user.lastName}&picture=${user.user.picture}`,
    );
  }

  @Get('info')
  @UseInterceptors(RefreshTokenInterceptor)
  async getInfo(@Tokens('access_token') access_token: string) {
    const verifyATService = new VerifyAccessTokenService(access_token);
    const verified = await verifyATService.verifyAccessToken();
    if (verified) {
      const resp = await this.authService.getInfo(access_token);
      return resp;
    } else {
      throw new UnauthorizedException('Please refresh access_token!');
    }
  }

  @Get('logout')
  async logout(
    @Tokens('access_token') accessToken: string,
    @Response() res: ExpressResponse,
  ): Promise<void> {
    await this.authService.revokeToken(accessToken);
    res.clearCookie('access_token', { secure: false, httpOnly: true });
    res.clearCookie('refresh_token', { secure: false, httpOnly: true });
    res.redirect(process.env.CLIENT_REDIRECT_URL);
  }
}
