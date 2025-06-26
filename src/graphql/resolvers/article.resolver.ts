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
  SortDirection,
} from '@/entities/article.entities';
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
  ArticleSearchResponse,
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
import { logger } from '@/libs/winston';
import { ArticleService } from '../services/article.service';
import esClient from '@/libs/elasticsearch';
import { GraphQLContext } from '@/@types/context';
import { ArticleElastic } from '../elastic/article.elastic';
import { User } from '@/entities/user.entities';

@Resolver(() => Article) // Main Resolver for Artile entity
export class ArticleResolver {
  private articleRepository: Repository<Article>;
  private articleService: ArticleService;
  private articleElastic: ArticleElastic;

  constructor() {
    this.articleRepository = AppDataSource.getRepository(Article);
    this.articleService = new ArticleService(this.articleRepository);

    this.articleElastic = new ArticleElastic(esClient);
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
  ): Promise<ArticlesResponse> {
    const articles = await this.articleService.getArticles(sort, limit, offset);

    // articles.content?.data?.map(async (article) => {
    //   await this.articleElastic.indexArticleInElasticsearch(article);
    // });

    return articles;
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

  @Query(() => ArticleSearchResponse, { nullable: true })
  async searchArticles(
    @Arg('limit', () => Int, { nullable: true }) limit: number,
    @Arg('offset', () => Int, { nullable: true }) offset: number,
    @Arg('searchKeyword', () => String, { nullable: true })
    searchKeyword: string,
  ): Promise<ArticleSearchResponse | null> {
    const articles = await this.articleElastic.searchArticleInElasticsearch(
      searchKeyword,
      limit,
      offset,
    );

    logger.info(articles);

    if (!articles) {
      return null;
    }

    return { id: articles };
  }

  /**---- Article Mutation ---- */
  @Mutation(() => CreateArticleResponse, { nullable: true })
  @Authorized()
  async createArticle(
    @Arg('input') input: CreateArticleInput,
    @Ctx() context: GraphQLContext,
  ): Promise<CreateArticleResponse | null> {
    try {
      const authorId = context.req.userId;
      const author = await this.articleRepository.manager.findOne(User, {
        where: { id: authorId },
      });

      if (!author) {
        throw new Error('Author not found.');
      }

      const savedArticle = await this.articleService.createNewArticle(
        authorId!,
        input,
      );

      if (!savedArticle.content?.data) {
        return null;
      }

      await this.articleElastic.indexArticleInElasticsearch(
        savedArticle.content.data,
      );

      return savedArticle;
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
