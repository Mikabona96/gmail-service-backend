import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';
import { RefreshTokenService } from '../providers/refreshToken.service';

@Injectable()
export class RefreshTokenInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const accessToken = request.cookies['access_token'] || '';
    const refreshToken = request.cookies['refresh_token'] || '';

    const refreshTokenService = new RefreshTokenService(
      accessToken,
      refreshToken,
    );
    return next.handle().pipe(
      catchError((err) => {
        if (err.response?.status === 401) {
          const response = context.switchToHttp().getResponse();
          if (!refreshToken) {
            response.redirect('/messages/error');
          }
          return refreshTokenService
            .verifyAccessToken(response)
            .then((newAccessToken) => {
              response.cookie('access_token', newAccessToken, { secure: true });
              response.redirect('/messages/list');
              return next.handle();
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
