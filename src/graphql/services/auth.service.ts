// Copyright 2025 chenterphai
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// src/services/AuthService.ts (or wherever you keep your services)
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/libs/jwt';
import { logger } from '@/libs/winston';

export class AuthService {
  async refreshTokens(
    refreshToken: string,
    userId: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    msg?: string;
    code?: number;
    status?: string;
  }> {
    if (!refreshToken) {
      return {
        code: 401,
        status: 'UNAUTHENTICATED',
        msg: 'No refresh token provided',
        accessToken: '', // Return empty for these
        refreshToken: '',
      };
    }

    let payload: any;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      logger.error(
        'AuthService: Invalid refresh token during verification',
        err,
      );
      return {
        code: 403,
        status: 'FORBIDDEN',
        msg: 'Invalid refresh token',
        accessToken: '',
        refreshToken: '',
      };
    }

    if (!payload.username) {
      // This case might mean the refresh token's payload is malformed or missing expected data
      logger.error(
        'AuthService: Username not found in refresh token payload for user ID:',
        userId,
      );
      return {
        code: 401,
        status: 'UNAUTHENTICATED',
        msg: 'Username missing in token payload',
        accessToken: '',
        refreshToken: '',
      };
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(userId, payload.username);

    // Generate new refresh token
    const newRefreshToken = generateRefreshToken(userId, payload.username);

    return {
      code: 0,
      status: 'OK',
      msg: 'Tokens refreshed successfully.',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
