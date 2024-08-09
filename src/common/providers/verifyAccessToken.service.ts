import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';

export class VerifyAccessTokenService {
  private oauth2Client: OAuth2Client;
  private ACCESS_TOKEN: string;

  constructor(ACCESS_TOKEN: string) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URL,
    );
    this.oauth2Client.setCredentials({
      access_token: ACCESS_TOKEN,
    });
    this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://mail.google.com/',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose',
      ],
    });
    this.ACCESS_TOKEN = ACCESS_TOKEN;
  }

  async verifyAccessToken() {
    try {
      await this.oauth2Client.getTokenInfo(this.ACCESS_TOKEN);
      return true;
    } catch (error) {
      console.log('Error access_token is expired or invalid!');
      return false;
    }
  }
}
