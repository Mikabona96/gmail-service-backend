import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

@Injectable()
export class RefreshTokenService {
  private oauth2Client: OAuth2Client;
  private access_token: string;
  constructor(access_token: string, refresh_token: string) {
    this.access_token = access_token;
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URL,
    );

    this.oauth2Client.setCredentials({
      access_token,
      refresh_token,
    });

    this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    });
  }
  async verifyAccessToken(response: any) {
    try {
      await this.oauth2Client.getTokenInfo(this.access_token);
    } catch (error) {
      console.log(
        'Error access_token is expired or invalid! Generating new access_token...',
      );
      return await this.refreshAccessToken(response);
    }
  }

  async refreshAccessToken(response: any) {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      return credentials.access_token;
    } catch (error) {
      console.log(
        'Error refreshToken is invalid! you will be redirected to "/messages/error"',
      );
      response.redirect('/messages/error');
    }
  }

  getClient() {
    return this.oauth2Client;
  }
}
