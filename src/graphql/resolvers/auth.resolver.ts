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
import { AuthResponse } from '../types/response.type';
import { LoginInput, RegisterInput } from '../types/input.type';
import { GraphQLContext } from '@/@types/context';
import { logger } from '@/libs/winston';
import { AuthService } from '../services/auth.service';

@Resolver(() => User)
export class AuthResolver {
  private authService: AuthService;

  constructor() {
    const userRepository = AppDataSource.getRepository(User);
    this.authService = new AuthService(userRepository);
  }

  @Mutation(() => AuthResponse)
  async register(
    @Arg('input') input: RegisterInput,
    @Ctx() context: GraphQLContext,
  ): Promise<AuthResponse> {
    try {
      const result = await this.authService.registerUser(input);
      return {
        status: {
          code: result.code,
          status: result.status,
          msg: result.msg,
        },
        content:
          result.accessToken && result.refreshToken
            ? {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                data: result.data ?? null,
              }
            : null,
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
      const result = await this.authService.loginUser(input);
      return {
        status: {
          code: result.code,
          status: result.status,
          msg: result.msg,
        },
        content:
          result.accessToken && result.refreshToken
            ? {
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                data: result.data ?? null,
              }
            : null,
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

  @Mutation(() => User, { nullable: true })
  @Authorized()
  async userProfile(@Ctx() context: GraphQLContext): Promise<User | null> {
    const userId = context.req.userId;
    return await this.authService.profile(userId!);
  }

  @Mutation(() => AuthResponse)
  async refreshToken(@Ctx() context: GraphQLContext): Promise<AuthResponse> {
    const authHeader = context.req.headers.authorization;
    const refreshToken = authHeader?.split(' ')[1];
    try {
      const result = await this.authService.refreshTokens(refreshToken!);
      return {
        status: {
          code: 0,
          status: 'OK',
          msg: 'Tokens refreshed successfully.',
        },
        content: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          data: null,
        },
      };
    } catch (error: any) {
      logger.error('AuthResolver: Error refreshing token:', error);
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
