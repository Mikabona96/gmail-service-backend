import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class MessagesService {
  //TODO add pageToken props to getMessages
  labelIds = [
    'INBOX',
    'SPAM',
    'TRASH',
    'UNREAD',
    'STARRED',
    'IMPORTANT',
    'SENT',
    'DRAFT',
    'CATEGORY_PERSONAL',
    'CATEGORY_SOCIAL',
    'CATEGORY_PROMOTIONS',
    'CATEGORY_UPDATES',
    'CATEGORY_FORUMS',
  ];
  async getMessages(
    accessToken: string,
    { labelIds, pageToken }: { labelIds?: string[]; pageToken?: string },
  ) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.list({
      userId: 'me',
      pageToken,
      labelIds,
    });

    const decodeBase64 = (encoded = '') => {
      const decodedBuffer = Buffer.from(encoded, 'base64');
      return decodedBuffer.toString('utf-8');
    };

    //* Get message's text
    const messagePromises = res.data.messages.map(async (msg) => {
      const messageRes = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
      });
      const messageResData = messageRes.data;

      const payload = messageRes.data.payload;

      if (!payload) {
        console.log('No payload for this message!');
        return;
      }

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

      let message = '';

      if (payload.body && payload.body.data) {
        message += decodeBase64(payload.body.data);
      }

      //$ Combine parts of message ================Start===============
      const parts = payload.parts || [];
      const attachments = [];

      parts.forEach((part) => {
        if (part.body && part.body.attachmentId) {
          attachments.push({
            partId: part.partId,
            filename: part.filename,
            headers: part.headers,
            attachment: part.body.attachmentId,
            size: part.body.size,
          });
        }
        if (part.parts) {
          part.parts.forEach((p) => {
            message += decodeBase64(p.body.data);
          });
        }
        message += decodeBase64(part.body.data);
      });

      //$ Combine parts of message ================End================
      let htmlPage = '';
      if (message.split('<html')[1]) {
        htmlPage = '<html ' + message.split('<html')[1];
      }

      const returnedObject = {
        id: messageResData.id,
        threadId: messageResData.threadId,
        labelIds: messageResData.labelIds,
        snippet: messageResData.snippet,
        headers: messageResData.payload.headers,
        sizeEstimate: messageResData.sizeEstimate,
        historyId: messageResData.historyId,
        internalDate: messageResData.internalDate,
        htmlPage,
        attachments,
      };

      // return { ...messageResData, htmlPage, attachments };
      return returnedObject;
    });

    const resolvedMessages = await Promise.all(messagePromises);
    //$ Add next page token
    return [{ nextPageToken: res.data.nextPageToken }, ...resolvedMessages];
    // return res.data.messages;
  }
}
