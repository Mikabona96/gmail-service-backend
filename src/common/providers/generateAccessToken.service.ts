import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';
import { UnauthorizedException } from '@nestjs/common';

export class GenerateAccessTokenService {
  private REFRESH_TOKEN: string;
  private oauth2Client: OAuth2Client;

  constructor(refreshToken: string) {
    this.REFRESH_TOKEN = refreshToken;

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URL,
    );
    this.oauth2Client.setCredentials({
      refresh_token: this.REFRESH_TOKEN,
    });
    this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    });
  }

  async getAccessToken() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      return credentials.access_token;
    } catch (error) {
      throw new UnauthorizedException('Refresh token is invalid!');
    }
  }
}
