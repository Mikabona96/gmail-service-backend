import { GoogleOAuthGuard } from '../guards/google-oauth.guard';
import { Controller, Get, Request, Response, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response as ExpressResponse } from 'express';
import { Tokens } from 'src/common/decorators/cookie-tokens';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('hello')
  getHello(@Request() req) {
    return 'Hello!';
  }

  @Get()
  @UseGuards(GoogleOAuthGuard)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async googleAuth(@Request() req) {}

  @Get('google-redirect')
  @UseGuards(GoogleOAuthGuard)
  googleAuthRedirect(@Request() req, @Response() res: ExpressResponse) {
    const user = this.authService.googleLogin(req);

    if (typeof user === 'string') return user;

    res.cookie('access_token', user.user.accessToken, {
      secure: true,
    });
    if (user.user.refreshToken) {
      res.cookie('refresh_token', user.user.refreshToken, {
        secure: true,
      });
    }

    res.json(user);
  }

  @Get('logout')
  async logout(
    @Tokens('access_token') accessToken: string,
    @Response() res: ExpressResponse,
  ): Promise<void> {
    await this.authService.revokeToken(accessToken);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.status(200).send('Logged out');
  }
}
