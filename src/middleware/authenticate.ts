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
import { AuthChecker } from 'type-graphql';

interface AuthenticatedUser {
  userId: number;
  username: string;
}

export const customAuthChecker: AuthChecker<GraphQLContext> = (
  { root, args, context, info },
  roles,
) => {
  // Read user from context
  // and check the user's permission against the `roles` argument
  // that comes from the '@Authorized' decorator, eg. ["ADMIN", "MODERATOR"]
  const authHeader = context.req.headers.authorization;
  const token = authHeader?.split(' ')[0];

  if (!token) {
    return false;
  }

  if (token?.startsWith('Bearer')) {
    return true;
  }
  try {
    const jwtPayload = verifyAccessToken(token) as AuthenticatedUser;
    context.req.userId = jwtPayload.userId;
    return true;
  } catch (error) {
    logger.error('Unauthorized. Invalid or expired token.');
    return false;
  }
};
