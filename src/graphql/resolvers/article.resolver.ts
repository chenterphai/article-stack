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
import { User } from '@/entities/user.entities';
import { AppDataSource } from '@/libs/postgresql';
import {
  Arg,
  Authorized,
  Ctx,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
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
import { ArticleService } from '../services/article.service';

@Resolver(() => Article) // Main Resolver for Artile entity
export class ArticleResolver {
  private articleRepository: Repository<Article>;
  private userRepository: Repository<User>;
  private articleService: ArticleService;

  constructor() {
    // const articleRepository: Repository<Article> = AppDataSource.getRepository(Article)
    this.articleRepository = AppDataSource.getRepository(Article);
    this.userRepository = AppDataSource.getRepository(User);
    this.articleService = new ArticleService(this.articleRepository);
  }

  /**---- Article Query ---- */
  @Query(() => ArticlesResponse)
  async articles(
    @Arg('limit', () => Int, { nullable: true }) limit: number,
    @Arg('offset', () => Int, { nullable: true }) offset: number,
    @Arg('sort', () => ArticleSortInput, {
      nullable: true,
      defaultValue: {
        field: ArticleSortField.CREATION_TIME,
        direction: SortDirection.DESC,
      },
    })
    sort: ArticleSortInput,
    @Arg('searchKeyword', () => String, { nullable: true })
    searchKeyword: string,
  ): Promise<ArticlesResponse> {
    return await this.articleService.getArticles(
      sort,
      limit,
      offset,
      searchKeyword,
    );
  }

  @Query(() => ArticleResponse, { nullable: true })
  async article(
    @Arg('id', () => ID) id: number,
  ): Promise<ArticleResponse | null> {
    try {
      return this.articleService.selectArticle(id);
    } catch (error) {
      logger.error(error);
      return null;
    }
  }

  /**---- Article Mutation ---- */
  @Mutation(() => CreateArticleResponse)
  @Authorized()
  async createArticle(
    @Arg('input') input: CreateArticleInput,
    @Ctx() context: GraphQLContext,
  ): Promise<CreateArticleResponse> {
    try {
      const authorId = context.req.userId;
      return await this.articleService.createNewArticle(authorId!, input);
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
  @Authorized()
  async updateArticle(
    @Arg('id') id: number,
    @Arg('input') input: UpdateArticleInput,
    @Ctx() context: GraphQLContext,
  ): Promise<UpdateArticleResponse> {
    try {
      return await this.articleService.updateArticle(id, input);
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
  @Authorized()
  async deleteArticle(@Arg('id') id: number): Promise<DeleteArticleResponse> {
    try {
      return await this.articleService.deleteArticle(id);
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
