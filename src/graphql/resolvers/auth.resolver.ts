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

import { Token } from '@/entities/token.entities';
import { User } from '@/entities/user.entities';
import { AppDataSource } from '@/libs/postgresql';
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from 'type-graphql';
import { Repository } from 'typeorm';
import { AuthResponse, ResponseStatus } from '../types/response.type';
import { LoginInput, RegisterInput } from '../types/input.type';
import { GraphQLContext } from '@/@types/context';
import bcrypt from 'bcrypt';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/libs/jwt';
import { cambodidaTimeFormater, futureDateTimeFormater } from '@/libs/dtf';
import config from '@/config';
import { logger } from '@/libs/winston';
import { authenticate } from '@/middleware/authenticate';

@Resolver(() => User)
export class AuthResolver {
  private userRepository: Repository<User>;
  private tokenRepository: Repository<Token>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.tokenRepository = AppDataSource.getRepository(Token);
  }

  @Mutation(() => AuthResponse)
  async register(
    @Arg('input') input: RegisterInput,
    @Ctx() context: GraphQLContext,
  ): Promise<AuthResponse> {
    try {
      const existingUser = await this.userRepository.findOne({
        where: [{ username: input.username }, { email: input.email }],
      });
      if (existingUser) {
        return {
          status: {
            code: 0,
            status: 'BAD_REQUEST',
            msg: 'Username or email already taken.',
          },
          content: null,
        };
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const newUser = this.userRepository.create({
        ...input,
        password: hashedPassword,
        creationtime: new Date(),
        updatetime: new Date(),
      });
      await this.userRepository.save(newUser);

      const accessToken = generateAccessToken(
        String(newUser.id),
        newUser.username,
      );

      const refrshToken = generateRefreshToken(
        String(newUser.id),
        newUser.username,
      );

      const newToken = this.tokenRepository.create({
        token: refrshToken,
        user: newUser,
        creationtime: cambodidaTimeFormater(),
        updatetime: cambodidaTimeFormater(),
        expiresAt: futureDateTimeFormater(config.REFRESH_TOKEN_EXPIRY),
        isRevoked: false,
      });
      await this.tokenRepository.save(newToken);

      context.res.cookie('refreshToken', refrshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      return {
        status: { code: 0, status: 'OK', msg: 'User registered successfully.' },
        content: {
          accessToken,
          data: newUser,
        },
      };
    } catch (error) {
      return {
        status: { code: 0, status: 'ERROR', msg: 'Internal Server Error.' },
        content: null,
      };
    }
  }

  @Mutation(() => AuthResponse)
  async login(
    @Arg('input') input: LoginInput,
    @Ctx() context: GraphQLContext,
  ): Promise<AuthResponse> {
    try {
      const { password, usernameOrEmail } = input;

      const user = await this.userRepository.findOne({
        where: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      });

      if (!user) {
        return {
          status: {
            code: 1,
            status: 'NOT_FOUND',
            msg: `User with username/email ${usernameOrEmail} not found!`,
          },
          content: null,
        };
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return {
          status: {
            code: 1,
            status: 'BAD_REQUEST',
            msg: `Invalid credentials`,
          },
          content: null,
        };
      }
      const activeToken = await this.tokenRepository.findOne({
        where: { user: { id: user.id }, isRevoked: false },
      });

      if (activeToken) {
        activeToken.isRevoked = true;
        await this.tokenRepository.save(activeToken);
      }

      const accessToken = generateAccessToken(String(user.id), user.username);
      const refrshToken = generateRefreshToken(String(user.id), user.username);

      const newToken = this.tokenRepository.create({
        token: refrshToken,
        user: user,
        creationtime: cambodidaTimeFormater(),
        updatetime: cambodidaTimeFormater(),
        expiresAt: futureDateTimeFormater(config.REFRESH_TOKEN_EXPIRY),
        isRevoked: false,
      });
      await this.tokenRepository.save(newToken);

      context.res.cookie('refreshToken', refrshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      logger.info(`User logged in succcessfully.`);

      return {
        status: {
          code: 0,
          status: 'OK',
          msg: 'User logged in successfully.',
        },
        content: {
          accessToken,
          data: user,
        },
      };
    } catch (error) {
      logger.error(`Error while user logging in.`, error);
      return {
        status: {
          code: 1,
          status: 'INTERNAL_SERVER_ERROR',
          msg: 'Error while user logging in.',
        },
        content: null,
      };
    }
  }

  @Mutation(() => ResponseStatus)
  @UseMiddleware(authenticate)
  async logout(@Ctx() context: GraphQLContext): Promise<ResponseStatus> {
    try {
      const userId = context.req.userId;
      if (!userId) {
        // Should be caught by middleware, but a fallback check is safe
        return {
          code: 1,
          status: 'UNAUTHORIZED',
          msg: 'Authentication failed. User ID not found in context.',
        };
      }

      const token = await this.tokenRepository.findOne({
        where: { user: { id: userId }, isRevoked: false },
        order: { creationtime: 'DESC' },
      });
      if (!token) {
        return {
          code: 1,
          status: 'NOT_FOUND',
          msg: `No active token found for user ID ${context.req.userId}.`,
        };
      }
      token.isRevoked = true;
      token.expiresAt = new Date();
      await this.tokenRepository.save(token);

      context.res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      return {
        code: 0,
        status: 'OK',
        msg: `Logged out user ID ${context.req.userId} successfully.`,
      };
    } catch (error: any) {
      console.error('Error during logout:', error);
      return {
        code: 1,
        status: 'ERROR',
        msg: error.message || 'Logout failed.',
      };
    }
  }

  @Mutation(() => AuthResponse)
  async refreshToken(@Ctx() context: GraphQLContext): Promise<AuthResponse> {
    try {
      // Validate refresh token from cookies
      const refreshTokenCookie = context.req.cookies.refreshToken;
      if (!refreshTokenCookie) {
        return {
          status: {
            code: 401,
            status: 'UNAUTHENTICATED',
            msg: 'No refresh token provided',
          },
          content: null,
        };
      }

      // Verify and get payload from refreshToken
      let payload: any;
      try {
        payload = verifyRefreshToken(refreshTokenCookie);
      } catch (err) {
        logger.error('Invalid refresh token:', err);
        return {
          status: {
            code: 403,
            status: 'FORBIDDEN',
            msg: 'Invalid refresh token',
          },
          content: null,
        };
      }

      // Get current user
      const user = await this.userRepository.findOne({
        where: { id: payload.userId },
      });
      if (!user) {
        return {
          status: {
            code: 401,
            status: 'UNAUTHENTICATED',
            msg: 'User not found.',
          },
          content: null,
        };
      }

      // Validate stored refreshToken
      const storedToken = await this.tokenRepository.findOne({
        where: {
          user: { id: user.id },
          token: refreshTokenCookie,
          isRevoked: false,
        },
      });

      if (
        !storedToken ||
        storedToken.isRevoked ||
        storedToken.expiresAt < new Date()
      ) {
        return {
          status: {
            code: 401,
            status: 'UNAUTHENTICATED',
            msg: 'Refresh token not found, revoked, or expired.',
          },
          content: null,
        };
      }

      // Token is valid: generate new tokens and update old refresh token
      storedToken.isRevoked = true;
      storedToken.expiresAt = new Date(); // Immediately expire old token
      await this.tokenRepository.save(storedToken);

      // Generate new access token
      const newAccessToken = generateAccessToken(
        String(user.id),
        user.username,
      );

      // Generate new refresh token
      const newRefreshToken = generateRefreshToken(
        String(user.id),
        user.username,
      );

      // Store new refresh token
      const newRefreshTokenEntity = this.tokenRepository.create({
        token: newRefreshToken,
        user: user,
        creationtime: cambodidaTimeFormater(),
        updatetime: cambodidaTimeFormater(),
        expiresAt: futureDateTimeFormater(config.REFRESH_TOKEN_EXPIRY),
        isRevoked: false,
      });
      await this.tokenRepository.save(newRefreshTokenEntity);

      // Set new refresh token to cookie
      context.res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: config.NODE_ENV === 'production',
      });

      return {
        status: {
          code: 0,
          status: 'OK',
          msg: 'Tokens refreshed successfully.',
        },
        content: {
          accessToken: newAccessToken,
          data: user,
        },
      };
    } catch (error: any) {
      // Clear cookie on any refresh token failure to force re-login
      context.res?.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      return {
        status: {
          code: 500,
          status: 'INTERNAL_SERVER_ERROR',
          msg: 'Failed to refresh token!',
        },
        content: null,
      };
    }
  }
}
