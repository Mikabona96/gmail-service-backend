import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class MessagesService {
  async getMessages(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.list({
      userId: 'me',
    });

    //* Get message's text
    const messagePromises = res.data.messages.map(async (message) => {
      const messageRes = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
      });
      const messageResData = messageRes.data;

      //+ Modified headers ==================Start================
      const modifiedHeaders = messageRes.data.payload.headers.filter(
        (header) => {
          if (
            header.name === 'Date' ||
            header.name === 'Subject' ||
            header.name === 'From' ||
            header.name === 'To'
          )
            return header;
        },
      );

      messageResData.payload.headers = modifiedHeaders;
      //+ Modified headers ==================End==================

      return messageResData;
    });

    const resolvedMessages = await Promise.all(messagePromises);
    //$ Add next page token
    return [{ nextPageToken: res.data.nextPageToken }, ...resolvedMessages];
    // return res.data.messages;
  }
}
