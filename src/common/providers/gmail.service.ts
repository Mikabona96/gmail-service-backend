import { Injectable } from '@nestjs/common';
import { gmail_v1, google } from 'googleapis';

@Injectable()
export class GmailService {
  private readonly auth = new google.auth.OAuth2();

  gmail(access_token: string): gmail_v1.Gmail {
    this.auth.setCredentials({ access_token });

    return google.gmail({ version: 'v1', auth: this.auth });
  }
}
