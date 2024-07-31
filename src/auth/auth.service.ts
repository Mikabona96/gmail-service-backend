import { Injectable } from '@nestjs/common';

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

  async revokeToken(token: string): Promise<void> {
    const url = `https://oauth2.googleapis.com/revoke?token=${token}`;

    try {
      await fetch(url, {
        method: 'POST',
      });
    } catch (error) {}
  }
}
