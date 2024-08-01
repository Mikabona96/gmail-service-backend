import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Tokens = createParamDecorator(
  (
    data: 'access_token' | 'refresh_token' | ['access_token', 'refresh_token'],
    ctx: ExecutionContext,
  ) => {
    const request = ctx.switchToHttp().getRequest();
    if (Array.isArray(data)) {
      return {
        access_token: request.cookies['access_token'],
        refresh_token: request.cookies['refresh_token'],
      };
    }
    return request.cookies[data] || '';
  },
);
