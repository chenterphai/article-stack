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
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';
import { Repository } from 'typeorm';
import {
  CommentResponse,
  CreateCommentResponse,
  DeleteCommentResponse,
} from '../types/response.type';
import { logger } from '@/libs/winston';
import { CreateCommentInput } from '../types/input.type';
import { GraphQLContext } from '@/@types/context';
import { authenticate } from '@/middleware/authenticate';

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

  @Query(() => CommentResponse)
  async comment(@Arg('id', () => Int) id: number): Promise<CommentResponse> {
    try {
      const comment = await this.commentRepository.findOne({
        where: { id: id },
        relations: ['author', 'article'],
      });
      if (!comment) {
        return {
          status: {
            code: 1,
            status: 'NOT_FOUND',
            msg: `Comment with ID ${id} not found.`,
          },
          content: null,
        };
      }
      return {
        status: {
          code: 0,
          status: 'OK',
          msg: `Comment with ID ${id} fetched successfully.`,
        },
        content: { data: comment },
      };
    } catch (error: any) {
      logger.error(error.message);
      return {
        status: {
          code: 1,
          status: 'INTERNAL_SERVER_ERROR',
          msg: 'Error while fetched a comment',
        },
        content: null,
      };
    }
  }

  @Mutation(() => CreateCommentResponse)
  @UseMiddleware(authenticate)
  async createComment(
    @Arg('input') input: CreateCommentInput,
    @Ctx() context: GraphQLContext,
  ): Promise<CreateCommentResponse> {
    try {
      const { articleId, content } = input;

      const authorId = context.req.userId;

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
        where: { id: input.articleId },
      });
      if (!article) {
        return {
          status: {
            code: 1,
            status: 'NOT_FOUND',
            msg: `Article with ID ${input.articleId} not found.`,
          },
          content: null,
        };
      }

      const newComment = this.commentRepository.create({
        content,
        article,
        author,
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
  @UseMiddleware(authenticate)
  async deleteCommentResponse(
    @Arg('id') id: string,
  ): Promise<DeleteCommentResponse> {
    try {
      const comment = await this.commentRepository.findOne({
        where: { id: parseInt(id, 10) },
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

  // Field resolvers for Comment Type
  @FieldResolver(() => User)
  async author(
    @Root() comment: Comment,
    @Ctx() context: GraphQLContext,
  ): Promise<User> {
    if (comment.author) {
      return comment.author;
    }
    const userRepository: Repository<User> =
      context.AppDataSource.getRepository(User);
    const fetchedAuthor = await userRepository.findOne({
      where: { id: (comment.author as User).id },
    });
    if (!fetchedAuthor) {
      throw new Error('Author not found for comment.');
    }
    return fetchedAuthor;
  }
}
