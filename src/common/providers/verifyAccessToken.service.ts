import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';

export class VerifyAccessTokenService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URL,
    );
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
  }

  async verifyAccessToken(access_token: string) {
    this.oauth2Client.setCredentials({
      access_token: access_token,
    });
    try {
      await this.oauth2Client.getTokenInfo(access_token);
      return true;
    } catch (error) {
      return false;
    }
  }
}
