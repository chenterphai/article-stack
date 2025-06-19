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

import { Article } from '@/entities/article.entities';
import { Comment } from '@/entities/comment.entities';
import { User } from '@/entities/user.entities';
import { AppDataSource } from '@/libs/postgresql';
import {
  Arg,
  Ctx,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { Repository } from 'typeorm';
import {
  CreateCommentResponse,
  DeleteCommentResponse,
} from '../types/response.type';
import { logger } from '@/libs/winston';
import { CreateCommentInput } from '../types/input.type';
import { GraphQLContext } from '@/@types/context';

@Resolver(() => Comment)
export class CommentResolver {
  private commentRepository: Repository<Comment>;
  private userRepository: Repository<User>;
  private articleRepository: Repository<Article>;

  constructor() {
    this.commentRepository = AppDataSource.getRepository(Comment);
    this.userRepository = AppDataSource.getRepository(User);
    this.articleRepository = AppDataSource.getRepository(Article);
  }
  @Mutation(() => CreateCommentResponse)
  async createComment(
    @Arg('input') input: CreateCommentInput,
    @Ctx() context: GraphQLContext,
  ): Promise<CreateCommentResponse> {
    try {
      const { articleId } = input;

      const authorId = 1;

      const author = await this.userRepository.findOne({
        where: {
          id: authorId,
        },
      });

      if (!author) {
        return {
          status: {
            code: 1,
            status: 'NOT_FOUND',
            msg: `Author with ID ${authorId} not found.`,
          },
          content: null,
        };
      }

      const article = await this.articleRepository.findOne({
        where: { id: articleId },
      });
      if (!article) {
        return {
          status: {
            code: 1,
            status: 'NOT_FOUND',
            msg: `Article with ID ${articleId} not found.`,
          },
          content: null,
        };
      }

      const newComment = this.commentRepository.create({
        ...input,
        author,
        article,
        creationtime: new Date(),
        updatetime: new Date(),
      });

      await this.commentRepository.save(newComment);

      logger.info(`Comment created successfully.`);
      return {
        status: {
          code: 0,
          status: 'CREATED',
          msg: 'Comment created successfully.',
        },
        content: { data: newComment },
      };
    } catch (error: any) {
      logger.error('Error creating comment: ', error);
      return {
        status: {
          code: 1,
          status: 'ERROR',
          msg: error.message || 'Failed to create comment.',
        },
        content: null,
      };
    }
  }

  @Mutation(() => DeleteCommentResponse)
  async deleteCommentResponse(
    @Arg('id') id: number,
  ): Promise<DeleteCommentResponse> {
    try {
      const comment = await this.commentRepository.findOne({
        where: { id },
      });
      if (!comment) {
        logger.warn('Comment not found.');
        return {
          status: {
            code: 1,
            status: 'NOT_FOUND',
            msg: 'Comment not found',
          },
          content: null,
        };
      }

      await this.commentRepository.remove(comment);
      return {
        status: {
          code: 0,
          status: 'OK',
          msg: `Comment with ID ${id} deleted successfully.`,
        },
        content: { message: `Comment with ID ${id} deleted successfully.` },
      };
    } catch (error: any) {
      logger.error('Error deleting comment: ', error);
      return {
        status: {
          code: 1,
          status: 'INTERNAL_SERVER_ERROR',
          msg: error?.message || 'Failed to delete comment.',
        },
        content: null,
      };
    }
  }
}
