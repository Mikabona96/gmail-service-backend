import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { MessageType } from './types';

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
          next.name === 'Date' ||
          next.name === 'Message-ID' ||
          next.name === 'References' ||
          next.name === 'In-Reply-To'
        ) {
          acc[next.name] = next.value;
        } else if (next.name === 'Message-Id') {
          acc['Message-ID'] = next.value;
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
    let attachments = [];

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

    if (attachments.length) {
      attachments = attachments.map(async (att) => {
        const attachmentString = await this.getAttachment(
          access_token,
          id,
          att.attachment,
        );

        return {
          ...att,
          attachment: attachmentString,
        };
      });
    }

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
      attachments: await Promise.all(attachments),
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

  async getAttachment(access_token: string, id: string, attachmentId: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: access_token });

    const gmail = google.gmail({ version: 'v1', auth });
    const res = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId: id,
      id: attachmentId,
    });
    function convertBase64UrlToBase64(base64Url: string) {
      let base64 = base64Url.replace(/_/g, '/').replace(/-/g, '+');
      switch (base64.length % 4) {
        case 2:
          base64 += '==';
          break;
        case 3:
          base64 += '=';
          break;
      }
      return `${base64}`;
    }

    return convertBase64UrlToBase64(res.data.data);
  }

  async getMessage(access_token: string, id: string) {
    try {
      await this.markAsRead(access_token, id);
      // await this.getAttachment(access_token, id);
      const res = await this.getOneMessage({ id, access_token });
      return res;
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
  }

  async sendReply(
    access_token: string,
    to: string,
    subject: string,
    text: string,
    messageId: string,
    threadId: string,
    originalMessage: MessageType,
  ) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: access_token });
    const gmail = google.gmail({ version: 'v1', auth });

    function formatDate(dateStr: string): string {
      const date = new Date(dateStr);

      return date
        .toLocaleString('en-US', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
        .replace(/,\s(\d{2}:\d{2}).*/, ' $1');
    }

    const formattedDate = formatDate(originalMessage.headers.Date);

    const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;

    const mailto = originalMessage.headers.To.match(/<([^>]+)>/)[1];

    const body = `
    <p>${text}</p>
    <div style="margin-top:20px; border-top:1px solid #ccc; padding-top:10px;">
      <p>On ${formattedDate}, ${mailto} wrote:</p>
      <blockquote style="margin:0; border-left:1px solid #ccc; padding-left:10px; color:#555;">
        ${originalMessage.snippet}
      </blockquote>
    </div>
  `;

    const emailContent = [
      `From: ${to}\r\nTo: ${to}\r\nSubject: ${replySubject}\r\nIn-Reply-To: ${messageId}\r\nReferences: ${messageId}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${body}`,
    ].join('\n');

    const encodedMessage = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          threadId: threadId,
        },
      });

      return result.data;
    } catch (error) {
      console.error('Error sending reply:', error);
      throw error;
    }
  }

  async sendMessage(access_token: string) {
    console.log('in message send');
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: access_token });
    const gmail = google.gmail({ version: 'v1', auth });

    const emailContent = [
      // `To: ${to}`,
      `To: dmitriygolubapk+1@gmail.com`,
      // `Subject: ${subject}`,
      `Subject: Got your message`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      '',
      // text,
      'Im fine thanks',
      //+ Attachment ===== start =======
      // '',
      // `--boundary_string`,
      // `Content-Type: application/octet-stream; name="${attachmentName}"`,
      // `Content-Disposition: attachment; filename="${attachmentName}"`,
      // `Content-Transfer-Encoding: base64`,
      // '',
      // attachmentContent, //$ Base64 string (attachment(img/video to string base64))
      // '',
      // `--boundary_string--`,
      //+ Attachment ===== end =======
    ].join('\n');

    const encodedMessage = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      return result.data;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
