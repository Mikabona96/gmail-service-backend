import { Injectable } from '@nestjs/common';

import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: 'https://api.openai.com/v1',
    });
  }

  async genReply() {
    const chatCompletion = await this.openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'User message here...' },
      ],

      model: 'gpt-3.5-turbo',
    });

    console.log(chatCompletion);

    return await chatCompletion;
  }
}
