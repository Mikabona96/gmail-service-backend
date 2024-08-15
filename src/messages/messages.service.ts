import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { gmail_v1 } from 'googleapis';
import { LabelIds, MessageType } from './types';
import { GmailService } from 'src/common/providers/gmail.service';
@Injectable()
export class MessagesService {
  constructor(private readonly gmailService: GmailService) {}

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
    const messageRes = await this.gmailService
      .gmail(access_token)
      .users.messages.get({
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
    const res = await this.gmailService.gmail(accessToken).users.messages.list({
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
    try {
      const res = await this.gmailService
        .gmail(access_token)
        .users.messages.trash({
          userId: 'me',
          id,
        });
      return res.data;
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
  }

  async toTrashBatch(access_token: string, ids: string[]) {
    try {
      const labelIds: LabelIds[] = [LabelIds.TRASH];
      const res = await this.gmailService
        .gmail(access_token)
        .users.messages.batchModify({
          userId: 'me',
          requestBody: {
            ids,
            addLabelIds: labelIds,
            removeLabelIds: [],
          },
        });
      return res.data;
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
  }

  async toSpamMessage(access_token: string, id: string) {
    try {
      const labelIds: LabelIds[] = [LabelIds.SPAM];
      const res = await this.gmailService
        .gmail(access_token)
        .users.messages.modify({
          userId: 'me',
          id,
          requestBody: {
            addLabelIds: labelIds,
            removeLabelIds: [],
          },
        });
      return res.data;
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
  }

  async markUnread(access_token: string, id: string) {
    try {
      const labelIds: LabelIds[] = [LabelIds.UNREAD];
      const res = await this.gmailService
        .gmail(access_token)
        .users.messages.modify({
          userId: 'me',
          id,
          requestBody: {
            addLabelIds: labelIds,
            removeLabelIds: [],
          },
        });
      return res.data;
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
  }
  async markAsRead(access_token: string, id: string) {
    try {
      const labelIds: LabelIds[] = [LabelIds.UNREAD];
      const res = await this.gmailService
        .gmail(access_token)
        .users.messages.modify({
          userId: 'me',
          id,
          requestBody: {
            addLabelIds: [],
            removeLabelIds: labelIds,
          },
        });
      return res.data;
    } catch (error) {
      throw new HttpException('Something went wrong', HttpStatus.BAD_REQUEST);
    }
  }

  async getAttachment(access_token: string, id: string, attachmentId: string) {
    const res = await this.gmailService
      .gmail(access_token)
      .users.messages.attachments.get({
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

  async getMessageFomThread(messageRes: gmail_v1.Schema$Message) {
    const decodeBase64 = (encoded = '') => {
      const decodedBuffer = Buffer.from(encoded, 'base64');
      return decodedBuffer.toString('utf-8');
    };

    const payload = messageRes.payload;

    if (!payload) {
      console.log('No payload for this message!');
      return;
    }

    let message = '';

    if (payload.body && payload.body.data) {
      message += decodeBase64(payload.body.data);
    }

    //$ Combine parts of message ================Start===============
    const parts = payload.parts || [];
    // let attachments = []; //Todo: Attachments logic

    parts.forEach((part) => {
      if (part.body && part.body.attachmentId) {
        //Todo: Attachments logic
      }
      if (part.parts) {
        part.parts.forEach((p) => {
          if (p.mimeType === 'text/html') {
            message += decodeBase64(p.body.data);
          }
          return;
        });
      }
      if (part.mimeType === 'text/html') {
        message += decodeBase64(part.body.data);
      }
    });

    return { ...messageRes, decodedValue: message };
  }

  async getThread({
    access_token,
    threadId,
  }: {
    access_token: string;
    threadId: string;
  }) {
    const res = await this.gmailService.gmail(access_token).users.threads.get({
      userId: 'me',
      id: threadId,
    });

    const filtered = res.data.messages.filter((msg) => msg.id !== threadId);

    const mapped = filtered.map(
      async (msg) => await this.getMessageFomThread(msg),
    );

    return await Promise.all(mapped);
  }

  async sendReply(access_token: string, text: string, messageId: string) {
    const originalMessage = (await this.getOneMessage({
      id: messageId,
      access_token,
    })) as MessageType;

    const messageFromThread = await this.getThread({
      access_token,
      threadId: originalMessage.threadId,
    });

    const originalText = messageFromThread.find(
      (m) => m.id === originalMessage.id,
    ).decodedValue;

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
    const subject = originalMessage.headers.Subject;

    const replySubject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;

    const From = originalMessage.headers.From.match(/(.*)\s<(.+)>/);
    const name = From ? From[1].trim() : '';
    const email = From ? From[2] : '';

    const modifiedBody = `
        <div dir="ltr">
          <div dir="ltr">${text}</div>
          <br>
          <div class="gmail_quote">
            <div dir="ltr" class="gmail_attr">${formattedDate}, ${name} &lt;${email}&gt;:
              <br>
            </div>
            <blockquote class="gmail_quote" style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">
              <div dir="ltr">${originalText}</div>
              <div class="yj6qo"></div>
              <div class="adL"></div>
            </blockquote>
          </div>
        </div>
    `;

    const emailContent = [
      `From: ${originalMessage.headers.To}\r\nTo: ${originalMessage.headers.From}\r\nSubject: ${replySubject}\r\nIn-Reply-To: ${originalMessage.headers['Message-ID']}\r\nReferences: ${originalMessage.headers['Message-ID']}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${modifiedBody}`,
    ].join('\n');

    const encodedMessage = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const result = await this.gmailService
        .gmail(access_token)
        .users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage,
            threadId: originalMessage.threadId,
          },
        });

      return result.data;
    } catch (error) {
      console.error('Error sending reply:', error);
      throw error;
    }
  }

  async sendMessage(
    access_token: string,
    { to, subject, message }: { to: string; subject: string; message: string },
  ) {
    const emailContent = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      '',
      // message,
      message,
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
      const result = await this.gmailService
        .gmail(access_token)
        .users.messages.send({
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
