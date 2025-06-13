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
import { User } from '@/entities/user.entities';
import { logger } from '@/libs/winston';
import { GraphQLError } from 'graphql';
import { Repository } from 'typeorm';

type AuthRole = 'admin' | 'user';

export const authorize =
  (roles: AuthRole[]) =>
  async ({ context }: { context: GraphQLContext }, next: Function) => {
    try {
      const userId = context.req.userId;
      if (!userId) {
        throw new GraphQLError(`Unauthorized: No user id in context.`, {
          extensions: {
            code: 'UNAUTHORIZED',
            http: { status: 401 },
          },
        });
      }
      const userRepository: Repository<User> =
        context.AppDataSource.getRepository(User);

      const user = await userRepository.findOneBy({ id: userId });

      if (!user) {
        throw new GraphQLError(`Not Found: User not found.`, {
          extensions: {
            code: 'NOT_FOUND',
            http: { status: 404 },
            msg: 'Not Found: User not found.',
          },
        });
      }

      if (!roles.includes(user.role)) {
        throw new GraphQLError(`Access Denied.Insufficient Permission.`, {
          extensions: {
            code: 'FORBIDDEN',
            http: { status: 403 },
            msg: 'Access Denied.Insufficient Permission.',
          },
        });
      }
      return next();
    } catch (error: any) {
      logger.error(error.extensions.msg);
      return {
        status: {
          code: 1,
          status: error.extensions.code,
          msg: error.extensions.msg,
        },
        content: null,
      };
    }
  };
