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

import { User } from '@/entities/user.entities';
import { AppDataSource } from '@/libs/postgresql';
import { Arg, Authorized, Ctx, Mutation, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import { AuthResponse } from '../types/response.type';
import { LoginInput, RegisterInput } from '../types/input.type';
import { GraphQLContext } from '@/@types/context';
import bcrypt from 'bcrypt';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/libs/jwt';
import config from '@/config';
import { logger } from '@/libs/winston';

@Resolver(() => User)
export class AuthResolver {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
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

      return {
        status: { code: 0, status: 'OK', msg: 'User registered successfully.' },
        content: {
          accessToken,
          refreshToken: refrshToken,
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
      const accessToken = generateAccessToken(String(user.id), user.username);
      const refrshToken = generateRefreshToken(String(user.id), user.username);

      logger.info(`User logged in succcessfully.`);

      return {
        status: {
          code: 0,
          status: 'OK',
          msg: 'User logged in successfully.',
        },
        content: {
          accessToken,
          refreshToken: refrshToken,
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

  @Mutation(() => AuthResponse)
  @Authorized()
  async refreshToken(@Ctx() context: GraphQLContext): Promise<AuthResponse> {
    const authHeader = context.req.headers.authorization;

    const refreshToken = authHeader?.split(' ')[1];

    try {
      if (!refreshToken) {
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
        payload = verifyRefreshToken(refreshToken);
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

      // Generate new access token
      if (!payload.username) {
        return {
          status: {
            code: 401,
            status: 'UNAUTHENTICATED',
            msg: 'No username found in request context',
          },
          content: null,
        };
      }
      const newAccessToken = generateAccessToken(
        String(context.req.userId),
        payload.username,
      );

      // Generate new refresh token
      const newRefreshToken = generateRefreshToken(
        String(context.req.userId),
        payload.username,
      );
      return {
        status: {
          code: 0,
          status: 'OK',
          msg: 'Tokens refreshed successfully.',
        },
        content: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          data: null,
        },
      };
    } catch (error: any) {
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
