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

import { Comment } from '@/entities/comment.entities';
import { AppDataSource } from '@/libs/postgresql';
import { Arg, Authorized, Ctx, Mutation, Resolver } from 'type-graphql';
import { Repository } from 'typeorm';
import {
  CreateCommentResponse,
  DeleteCommentResponse,
  ResponseStatus,
} from '../types/response.type';
import { CreateCommentInput, UpdateCommentInput } from '../types/input.type';
import { GraphQLContext } from '@/@types/context';
import { CommentService } from '../services/comment.service';

@Resolver(() => Comment)
export class CommentResolver {
  private commentRepository: Repository<Comment>;

  private commentService: CommentService;

  constructor() {
    this.commentRepository = AppDataSource.getRepository(Comment);
    this.commentService = new CommentService(this.commentRepository);
  }
  @Mutation(() => CreateCommentResponse)
  @Authorized()
  async createComment(
    @Arg('input') input: CreateCommentInput,
    @Ctx() context: GraphQLContext,
  ): Promise<CreateCommentResponse> {
    const authorId = context.req.userId;
    return await this.commentService.createComment(authorId!, input);
  }

  @Mutation(() => DeleteCommentResponse)
  @Authorized()
  async deleteCommentResponse(
    @Arg('id') id: number,
  ): Promise<DeleteCommentResponse> {
    return await this.commentService.deleteComment(id);
  }

  @Mutation(() => ResponseStatus)
  @Authorized()
  async updateComment(
    @Arg('id') id: number,
    @Arg('input') input: UpdateCommentInput,
  ): Promise<ResponseStatus> {
    return await this.commentService.updateComment(id, input);
  }
}
