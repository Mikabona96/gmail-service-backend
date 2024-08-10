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
