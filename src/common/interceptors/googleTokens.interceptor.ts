import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { GenerateAccessTokenService } from '../providers/generateAccessToken.service';

@Injectable()
export class RefreshTokenInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    //+ Before controller ===============Start=================

    const request = context.switchToHttp().getRequest();
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
          return generateAccessTokenService
            .getAccessToken()
            .then((access_token) => {
              response.cookie('access_token', access_token, {
                secure: false,
                httpOnly: true,
              });
              response.redirect('/messages/list');
            });
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
