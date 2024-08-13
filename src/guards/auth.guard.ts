import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { GenerateAccessTokenService } from 'src/common/providers/generateAccessToken.service';
import { VerifyAccessTokenService } from 'src/common/providers/verifyAccessToken.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly verifyAccessTokenService: VerifyAccessTokenService,
    private readonly generateAccessTokenService: GenerateAccessTokenService,
    private reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest() as Request;
    const response = context.switchToHttp().getResponse() as Response;
    const access_token = request.cookies['access_token'];
    const refresh_token = request.cookies['refresh_token'];

    if (!refresh_token) return false;

    const isValid =
      await this.verifyAccessTokenService.verifyAccessToken(access_token);

    if (!isValid) {
      const newAtToken =
        await this.generateAccessTokenService.getAccessToken(refresh_token);

      request.cookies['access_token'] = newAtToken;
      response.cookie('access_token', newAtToken, {
        secure: false,
        httpOnly: true,
      });
      if (!newAtToken) {
        return false;
      }
    }

    return true;
  }
}
