import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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

  getOneMessage = async ({
    id,
    access_token,
  }: {
    id: string;
    access_token: string;
  }) => {
    const decodeBase64 = (encoded = '') => {
      const decodedBuffer = Buffer.from(encoded, 'base64');
      return decodedBuffer.toString('utf-8');
    };
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token });

    const gmail = google.gmail({ version: 'v1', auth });
    const messageRes = await gmail.users.messages.get({
      userId: 'me',
      id: id,
    });
    const messageResData = messageRes.data;

    const payload = messageRes.data.payload;

    if (!payload) {
      console.log('No payload for this message!');
      return;
    }

    //+ Modified headers ==================Start================
    const modifiedHeaders = messageRes.data.payload.headers.reduce(
      (acc, next) => {
        if (
          next.name === 'Subject' ||
          next.name === 'From' ||
          next.name === 'To' ||
          next.name === 'Date'
        ) {
          acc[next.name] = next.value;
        }
        return acc;
      },
      {},
    );

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
      snippet: messageResData.snippet.trim(),
      headers: modifiedHeaders,
      sizeEstimate: messageResData.sizeEstimate,
      historyId: messageResData.historyId,
      internalDate: messageResData.internalDate,
      htmlPage,
      attachments,
    };

    return returnedObject;
  };

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

    //* Get message's text
    const messagePromises = res.data.messages.map(async (msg) => {
      return await this.getOneMessage({
        access_token: accessToken,
        id: msg.id,
      });
    });

    const resolvedMessages = await Promise.all(messagePromises);
    //$ Add next page token
    return {
      nextPageToken: res.data.nextPageToken,
      messages: [...resolvedMessages],
    };
    // return res.data.messages;
  }

  async toTrashMessage(access_token: string, id: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: access_token });

    const gmail = google.gmail({ version: 'v1', auth });
    try {
      const res = await gmail.users.messages.trash({
        userId: 'me',
        id,
      });
      return res.data;
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
  }

  async toSpamMessage(access_token: string, id: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: access_token });

    const gmail = google.gmail({ version: 'v1', auth });
    try {
      const res = await gmail.users.messages.modify({
        userId: 'me',
        id,
        requestBody: {
          addLabelIds: ['SPAM'],
          removeLabelIds: [],
        },
      });
      return res.data;
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
  }

  async markUnread(access_token: string, id: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: access_token });

    const gmail = google.gmail({ version: 'v1', auth });
    try {
      const res = await gmail.users.messages.modify({
        userId: 'me',
        id,
        requestBody: {
          addLabelIds: ['UNREAD'],
          removeLabelIds: [],
        },
      });
      return res.data;
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
  }
  async markAsRead(access_token: string, id: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: access_token });

    const gmail = google.gmail({ version: 'v1', auth });
    try {
      const res = await gmail.users.messages.modify({
        userId: 'me',
        id,
        requestBody: {
          addLabelIds: [],
          removeLabelIds: ['UNREAD'],
        },
      });
      return res.data;
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
  }
  async getMessage(access_token: string, id: string) {
    try {
      await this.markAsRead(access_token, id);
      const res = await this.getOneMessage({ id, access_token });
      return res;
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
  }
}
