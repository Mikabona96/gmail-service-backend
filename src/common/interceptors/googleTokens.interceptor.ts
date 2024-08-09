import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { catchError, from, Observable, switchMap, throwError } from 'rxjs';
import { GenerateAccessTokenService } from '../providers/generateAccessToken.service';
import { Request } from 'express';

@Injectable()
export class RefreshTokenInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    //+ Before controller ===============Start=================

    const request = context.switchToHttp().getRequest() as Request;
    const response = context.switchToHttp().getResponse();
    const refreshToken = request.cookies['refresh_token'] || '';

    //+ Before controller ===============End=================
    return next.handle().pipe(
      catchError((err) => {
        //$ After error in controller ===============================
        if (err.status === 401) {
          if (!refreshToken) {
            throw new UnauthorizedException(
              "No refresh token, It seems that you're logged out!",
            );
          }
          const generateAccessTokenService = new GenerateAccessTokenService(
            refreshToken,
          );
          return from(generateAccessTokenService.getAccessToken()).pipe(
            switchMap((accessToken: string) => {
              request.cookies.access_token = accessToken;

              response.cookie('access_token', accessToken, {
                secure: false,
                httpOnly: true,
              });
              return next.handle();
            }),
            catchError((retryError) => {
              return throwError(() => retryError);
            }),
          );
        }
        return throwError(
          () =>
            new HttpException(
              err.response?.data || err.message,
              err.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            ),
        );
      }),
    );
  }
}
