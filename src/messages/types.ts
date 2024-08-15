export type MessageType = {
  attachments: any[];
  headers: {
    Subject: string;
    To: string;
    From: string;
    Date: string;
    'Message-ID': string;
    References?: string;
    'In-Reply-To'?: string;
  };
  historyId: string;
  htmlPage: string;
  id: string;
  internalDate: string;
  labelIds: string[];
  sizeEstimate: number;
  snippet: string;
  threadId: string;
};

export enum LabelIds {
  INBOX = 'INBOX',
  SPAM = 'SPAM',
  TRASH = 'TRASH',
  UNREAD = 'UNREAD',
  STARRED = 'STARRED',
  IMPORTANT = 'IMPORTANT',
  SENT = 'SENT',
  DRAFT = 'DRAFT',
  CATEGORY_PERSONAL = 'CATEGORY_PERSONAL',
  CATEGORY_SOCIAL = 'CATEGORY_SOCIAL',
  CATEGORY_PROMOTIONS = 'CATEGORY_PROMOTIONS',
  CATEGORY_UPDATES = 'CATEGORY_UPDATES',
  CATEGORY_FORUMS = 'CATEGORY_FORUMS',
}
