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
import { Arg, Ctx, Int, Mutation, Query, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import {
  ArticlesResponse,
  CreateArticleResponse,
} from '../types/response.type';
import { CreateArticleInput } from '../types/input.type';
import { GraphQLContext } from '@/@types/context';

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
  ): Promise<ArticlesResponse> {
    try {
      const articles = await this.articleRepository.find({
        relations: ['author'],
        take: limit,
        skip: offset,
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

  /**---- Article Mutation ---- */
  @Mutation(() => CreateArticleResponse)
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
}
