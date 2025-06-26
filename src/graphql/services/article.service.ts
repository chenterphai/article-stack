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
import { Brackets, Repository } from 'typeorm';
import {
  ArticleResponse,
  ArticlesResponse,
  CreateArticleResponse,
  DeleteArticleResponse,
  UpdateArticleResponse,
} from '../types/response.type';
import { logger } from '@/libs/winston';
import { User } from '@/entities/user.entities';
import { AppDataSource } from '@/libs/postgresql';
import { CreateArticleInput, UpdateArticleInput } from '../types/input.type';

export class ArticleService {
  private articleRepository: Repository<Article>;
  private userRepository: Repository<User>;

  constructor(articleRepository: Repository<Article>) {
    this.articleRepository = articleRepository;
    this.userRepository = AppDataSource.getRepository(User);
  }

  // --- SELECT ALL ARTICLE ---
  async getArticles(
    sort: { field: ArticleSortField; direction: SortDirection },
    limit?: number,
    offset?: number,
  ): Promise<ArticlesResponse> {
    try {
      const order: { [key: string]: 'ASC' | 'DESC' } = {};
      order[sort.field] = sort.direction;

      // Query Builder
      const queryBuilder =
        this.articleRepository.createQueryBuilder('fa_articles');

      queryBuilder.where('fa_articles.status = :status', {
        status: ArticleStatus.PUBLISHED,
      });

      queryBuilder
        .leftJoinAndSelect('fa_articles.author', 'fa_users')
        .loadRelationCountAndMap(
          'fa_articles.commentCount',
          'fa_articles.comments',
          'fa_comments_alias',
        )
        .orderBy(`fa_articles.${sort.field}`, sort.direction)
        .take(limit)
        .skip(offset);

      const articles = await queryBuilder.getMany();

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

  /** --- SELECT A SINGLE ARTICLE --- */
  async selectArticle(id: number): Promise<ArticleResponse | null> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['author', 'comments'],
    });
    if (!article) {
      return null;
    }

    return {
      status: {
        code: 0,
        status: 'OK',
        msg: `Article with ID ${id} fetched successfully.`,
      },
      content: { data: article },
    };
  }

  /** --- CREATE ARTICLE METHOD --- */
  async createNewArticle(
    authorId: number,
    input: CreateArticleInput,
  ): Promise<CreateArticleResponse> {
    const author = await this.userRepository.findOne({
      where: { id: authorId },
    });
    if (!author) {
      return {
        status: {
          code: 1,
          status: 'NOT_FOUND',
          msg: `Author with ID ${authorId} not found!`,
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
  }

  /** --- UPDATE ARTICLE METHOD --- */
  async updateArticle(
    id: number,
    input: UpdateArticleInput,
  ): Promise<UpdateArticleResponse> {
    const { slug } = input;
    const article = await this.articleRepository.findOne({
      where: { id },
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

    //Validate slug: if slug already exists
    if (slug && slug !== article.slug) {
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

    await this.articleRepository.update(id, {
      ...input,
      updatetime: new Date(),
    });

    return {
      status: { code: 0, status: 'OK', msg: 'Article updated successfully.' },
      content: null,
    };
  }

  // --- DELETE ARTICLE METHOD ---
  async deleteArticle(id: number): Promise<DeleteArticleResponse> {
    const article = await this.articleRepository.findOne({
      where: { id },
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
  }
}
