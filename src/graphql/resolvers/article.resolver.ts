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

import {
  Article,
  ArticleSortField,
  ArticleStatus,
  SortDirection,
} from '@/entities/article.entities';
import { Comment } from '@/entities/comment.entities';
import { User } from '@/entities/user.entities';
import { AppDataSource } from '@/libs/postgresql';
import {
  Arg,
  Ctx,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from 'type-graphql';
import { Repository } from 'typeorm';
import {
  ArticleResponse,
  ArticlesResponse,
  CreateArticleResponse,
  DeleteArticleResponse,
  UpdateArticleResponse,
} from '../types/response.type';
import {
  ArticleSortInput,
  CreateArticleInput,
  UpdateArticleInput,
} from '../types/input.type';
import { GraphQLContext } from '@/@types/context';
import { logger } from '@/libs/winston';
import { authenticate } from '@/middleware/authenticate';
import { authorize } from '@/middleware/authorize';

@Resolver(() => Article) // Main Resolver for Artile entity
export class ArticleResolver {
  private articleRepository: Repository<Article>;
  private userRepository: Repository<User>;
  private commentRepository: Repository<Comment>;

  constructor() {
    this.articleRepository = AppDataSource.getRepository(Article);
    this.userRepository = AppDataSource.getRepository(User);
    this.commentRepository = AppDataSource.getRepository(Comment);
  }

  /**---- Article Query ---- */
  @Query(() => ArticlesResponse)
  async articles(
    @Arg('liimit', () => Int, { nullable: true }) limit: number,
    @Arg('offset', () => Int, { nullable: true }) offset: number,
    @Arg('sort', () => ArticleSortInput, {
      nullable: true,
      defaultValue: {
        field: ArticleSortField.CREATION_TIME,
        direction: SortDirection.DESC,
      },
    })
    sort: ArticleSortInput,
  ): Promise<ArticlesResponse> {
    try {
      // Build the order object dynamically
      const order: { [key: string]: 'ASC' | 'DESC' } = {};

      order[sort.field] = sort.direction;

      const articles = await this.articleRepository.find({
        where: { status: ArticleStatus.PUBLISHED },
        relations: ['author'],
        take: limit,
        skip: offset,
        order: order,
      });
      return {
        status: {
          code: 0,
          status: 'OK',
          msg: 'Articles fetched successfully.',
        },
        content: { data: articles },
      };
    } catch (error: any) {
      return {
        status: {
          code: 1,
          status: 'ERROR',
          msg: error.message || 'Failed to fetch articles.',
        },
        content: null,
      };
    }
  }

  @Query(() => ArticleResponse)
  async article(@Arg('id', () => ID) id: string): Promise<ArticleResponse> {
    try {
      const article = await this.articleRepository.findOne({
        where: { id: parseInt(id, 10) },
        relations: ['author', 'comments'],
      });
      if (!article) {
        return {
          status: {
            code: 1,
            status: 'NOT_FOUND',
            msg: `Article with ID ${id} not found.`,
          },
          content: null,
        };
      }
      return {
        status: {
          code: 0,
          status: 'OK',
          msg: `Article with ID ${id} fetched successfully.`,
        },
        content: { data: article },
      };
    } catch (error) {
      logger.error(error);
      return {
        status: {
          code: 0,
          status: 'INTERNAL_SERVER_ERROR',
          msg: `Error while fetching article.`,
        },
        content: null,
      };
    }
  }

  /**---- Article Mutation ---- */
  @Mutation(() => CreateArticleResponse)
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(['admin', 'user']))
  async createArticle(
    @Arg('input') input: CreateArticleInput,
    @Ctx() context: GraphQLContext,
  ): Promise<CreateArticleResponse> {
    try {
      const author = await this.userRepository.findOne({
        where: { id: input.authorId },
      });
      if (!author) {
        return {
          status: {
            code: 1,
            status: 'NOT_FOUND',
            msg: `Author with ID ${input.authorId} not found!`,
          },
          content: null,
        };
      }

      const existingSlug = await this.articleRepository.findOne({
        where: { slug: input.slug },
      });
      if (existingSlug) {
        return {
          status: {
            code: 1,
            status: 'CONFLICT',
            msg: `Article with slug "${input.slug}" already exists.`,
          },
          content: null,
        };
      }

      const newArticle = this.articleRepository.create({
        ...input,
        author: author,
        creationtime: new Date(),
        updatetime: new Date(),
      });

      await this.articleRepository.save(newArticle);
      logger.info(`Article created successfully.`, newArticle.id);
      return {
        status: {
          code: 0,
          status: 'CREATED',
          msg: 'Article created successfully.',
        },
        content: { data: newArticle },
      };
    } catch (error: any) {
      return {
        status: {
          code: 1,
          status: 'ERROR',
          msg: error.message || 'Failed to create articles.',
        },
        content: null,
      };
    }
  }

  @Mutation(() => UpdateArticleResponse)
  @UseMiddleware(authenticate)
  @UseMiddleware(authorize(['admin', 'user']))
  async updateArticle(
    @Arg('input') input: UpdateArticleInput,
    @Ctx() context: GraphQLContext,
  ): Promise<UpdateArticleResponse> {
    // Destrcuture input
    const { id, authorId, content, slug, status, title } = input;
    try {
      // Validate article: check if has article
      const article = await this.articleRepository.findOne({
        where: { id: parseInt(id, 10) },
      });
      if (!article) {
        return {
          status: {
            code: 1,
            status: 'NOT_FOUND',
            msg: `Article with ID ${id} not found.`,
          },
          content: null,
        };
      }

      // Validate author
      if (authorId !== undefined) {
        const newAuthor = await this.userRepository.findOne({
          where: { id: authorId },
        });
        if (!newAuthor) {
          return {
            status: {
              code: 1,
              status: 'NOT_FOUND',
              msg: `New author with ID ${authorId} not found.`,
            },
            content: null,
          };
        }
        article.author = newAuthor;
      }

      //Validate slug: if slug already exists
      if (slug !== undefined && slug !== article.slug) {
        const existingSlug = await this.articleRepository.findOne({
          where: { slug: slug },
        });
        if (existingSlug) {
          return {
            status: {
              code: 1,
              status: 'CONFLICT',
              msg: `Slug "${slug}" is already in use by another article.`,
            },
            content: null,
          };
        }
        article.slug = slug;
      }

      // Update article
      if (title) article.title = title;
      if (content) article.content = content;
      if (status) article.status = status;
      article.updatetime = new Date();

      // Save new update article
      await this.articleRepository.save(article);
      return {
        status: { code: 0, status: 'OK', msg: 'Article updated successfully.' },
        content: { data: article },
      };
    } catch (error: any) {
      console.error('Error updating article:', error);
      return {
        status: {
          code: 1,
          status: 'ERROR',
          msg: error.message || 'Failed to update article.',
        },
        content: null,
      };
    }
  }

  @Mutation(() => DeleteArticleResponse)
  async deleteArticle(
    @Arg('id') id: string,
    @Ctx() context: GraphQLContext,
  ): Promise<DeleteArticleResponse> {
    try {
      const article = await this.articleRepository.findOne({
        where: { id: parseInt(id, 10) },
      });
      if (!article) {
        return {
          status: {
            code: 1,
            status: 'NOT_FOUND',
            msg: `Article with ID ${id} not found.`,
          },
          content: { message: `Article with ID ${id} not found.` },
        };
      }

      await this.articleRepository.remove(article);
      return {
        status: {
          code: 0,
          status: 'OK',
          msg: `Article with ID ${id} deleted successfully.`,
        },
        content: { message: `Article with ID ${id} deleted successfully.` },
      };
    } catch (error: any) {
      console.error('Error deleting article:', error);
      return {
        status: {
          code: 1,
          status: 'ERROR',
          msg: error.message || 'Failed to delete article.',
        },
        content: { message: error.message || 'Failed to delete article.' },
      };
    }
  }
}
