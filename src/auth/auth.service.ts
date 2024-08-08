import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

type ReturnType = {
  message: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
    accessToken: string;
    refreshToken?: string;
  };
};

@Injectable()
export class AuthService {
  googleLogin(req): ReturnType | string {
    if (!req.user) {
      return 'No user from google';
    }

    return {
      message: 'User information from google',
      user: req.user,
    };
  }

  async getInfo(access_token: string) {
    try {
      const resp = await fetch(
        'https://www.googleapis.com/oauth2/v1/userinfo',
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );
      return resp.json();
    } catch (error) {
      throw new HttpException(
        'Something went wrong...',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async revokeToken(token: string): Promise<void> {
    const url = `https://oauth2.googleapis.com/revoke?token=${token}`;

    try {
      await fetch(url, {
        method: 'POST',
      });
    } catch (error) {}
  }
}
