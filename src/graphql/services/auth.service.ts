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
import { User } from '@/entities/user.entities';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/libs/jwt';
import { logger } from '@/libs/winston';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';

export class AuthService {
  private userRepository: Repository<User>;

  constructor(userRepository: Repository<User>) {
    this.userRepository = userRepository;
  }

  // --- REGISTRATION METHOD ---
  async registerUser(input: {
    username: string;
    email: string;
    password: string;
  }): Promise<{
    accessToken?: string;
    refreshToken?: string;
    data?: User; // Include user data if successful
    msg: string;
    code: number;
    status: string;
  }> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: [{ username: input.username }, { email: input.email }],
      });

      if (existingUser) {
        logger.warn(
          `AuthService: Attempted registration with existing username or email: ${input.username}/${input.email}`,
        );
        return {
          code: 400,
          status: 'BAD_REQUEST',
          msg: 'Username or email already taken.',
        };
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const newUser = this.userRepository.create({
        username: input.username,
        email: input.email,
        password: hashedPassword,
        creationtime: new Date(),
        updatetime: new Date(),
      });
      await this.userRepository.save(newUser);

      if (!newUser.id) {
        logger.error('AuthService: newUser ID is undefined after saving.');
        return {
          code: 500,
          status: 'INTERNAL_SERVER_ERROR',
          msg: 'User created but ID not available for token generation.',
        };
      }

      const accessToken = generateAccessToken(
        String(newUser.id),
        newUser.username,
      );
      const refreshToken = generateRefreshToken(
        String(newUser.id),
        newUser.username,
      );

      return {
        code: 200, // Or 201 for Created
        status: 'OK',
        msg: 'User registered successfully.',
        accessToken,
        refreshToken,
        data: newUser, // Return the newly created user object
      };
    } catch (error: any) {
      logger.error('AuthService: Failed to register user:', error);
      return {
        code: 500,
        status: 'INTERNAL_SERVER_ERROR',
        msg:
          error.message || 'An unexpected error occurred during registration.',
      };
    }
  }

  // --- LOGIN METHOD ---
  async loginUser(input: {
    usernameOrEmail: string;
    password: string;
  }): Promise<{
    accessToken?: string;
    refreshToken?: string;
    data?: User;
    msg: string;
    code: number;
    status: string;
  }> {
    try {
      const { password, usernameOrEmail } = input;

      const user = await this.userRepository.findOne({
        where: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      });

      if (!user) {
        logger.warn(
          `AuthService: Login attempt for non-existent user/email: ${usernameOrEmail}`,
        );
        return {
          code: 404,
          status: 'NOT_FOUND',
          msg: `User with username/email ${usernameOrEmail} not found!`,
        };
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        logger.warn(
          `AuthService: Invalid credentials for user: ${usernameOrEmail}`,
        );
        return {
          code: 400,
          status: 'BAD_REQUEST',
          msg: `Invalid credentials`,
        };
      }

      const accessToken = generateAccessToken(String(user.id), user.username);
      const refreshToken = generateRefreshToken(String(user.id), user.username);

      logger.info(`AuthService: User logged in successfully: ${user.username}`);

      return {
        code: 200,
        status: 'OK',
        msg: 'User logged in successfully.',
        accessToken,
        refreshToken,
        data: user,
      };
    } catch (error: any) {
      logger.error(`AuthService: Error while user logging in:`, error);
      return {
        code: 500,
        status: 'INTERNAL_SERVER_ERROR',
        msg: error.message || 'An unexpected error occurred during login.',
      };
    }
  }

  // --- REFRESH TOKEN METHOD ---
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
