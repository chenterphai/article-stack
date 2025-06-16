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

import { GraphQLContext } from '@/@types/context';
import { verifyAccessToken } from '@/libs/jwt';
import { logger } from '@/libs/winston';
import { NextFunction } from 'express';
import { GraphQLError } from 'graphql';
import { MiddlewareFn } from 'type-graphql';

interface AuthenticatedUser {
  userId: number;
  username: string;
}

export const authenticate: MiddlewareFn<GraphQLContext> = async (
  { context },
  next: NextFunction,
) => {
  const authHeader = context.req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new GraphQLError('Unauthorized: Missing Bearer token.', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
        msg: 'Unauthorized: Missing Bearer token.',
      },
    });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new GraphQLError('Unauthorized: Token not provided.', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
        msg: 'Unauthorized: Token not provided.',
      },
    });
  }
  try {
    const jwtPayload = verifyAccessToken(token) as AuthenticatedUser;
    context.req.userId = jwtPayload.userId;
    context.req.username = jwtPayload.username;
    logger.info(`User ${jwtPayload.userId} authenticated.`);
    return next();
  } catch (error) {
    throw new GraphQLError('Unauthorized: Invalid or expired token.', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }
};
