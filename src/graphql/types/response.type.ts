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
import { Field, ID, Int, ObjectType } from 'type-graphql';

@ObjectType()
export class ResponseStatus {
  @Field(() => Int)
  code!: number; // 0 for success, 1 for failure, or other custom codes

  @Field()
  status!: string; // e.g., "OK", "ERROR", "NOT_FOUND", "VALIDATION_ERROR"

  @Field()
  msg!: string; // A human-readable message
}

// Generic content wrapper for single data
@ObjectType()
export class SingleContent<T> {}

// Generic content wrapper for list data
@ObjectType()
export class ListContent<T> {}

/**
 * ARTICLE TYPES
 * All types of article will be here.
 */
@ObjectType()
export class ArticlesContent extends ListContent<Article> {
  @Field(() => [Article], { nullable: true })
  data!: Article[] | null;
}

@ObjectType()
class SingleArticleContent {
  @Field(() => Article, { nullable: true })
  data!: Article | null;
}

@ObjectType()
export class ArticlesResponse {
  @Field(() => ResponseStatus)
  status!: ResponseStatus;

  @Field(() => ArticlesContent, { nullable: true })
  content!: ArticlesContent | null;
}

@ObjectType()
export class ArticleResponse {
  @Field(() => ResponseStatus)
  status!: ResponseStatus;

  @Field(() => SingleArticleContent, { nullable: true })
  content!: SingleArticleContent | null;
}

/** --- Create article content --- */
@ObjectType()
class CreateArticleContent extends SingleContent<Article> {
  @Field(() => Article)
  data!: Article;
}

/** --- Create article respnse --- */
@ObjectType()
export class CreateArticleResponse {
  @Field(() => ResponseStatus)
  status!: ResponseStatus;

  @Field(() => CreateArticleContent, { nullable: true })
  content!: CreateArticleContent | null;
}

/** --- Update Article Content --- */
@ObjectType()
class UpdateArticleContent extends SingleContent<Article> {
  @Field(() => Article)
  data!: Article;
}

/** --- Update article response --- */
@ObjectType()
export class UpdateArticleResponse {
  @Field(() => ResponseStatus)
  status!: ResponseStatus;
  @Field(() => UpdateArticleContent, { nullable: true })
  content!: UpdateArticleContent | null;
}

/** --- Delete article content --- */
@ObjectType()
class DeleteArticleContent {
  @Field()
  message!: string;
}

/** --- Delete article response --- */
@ObjectType()
export class DeleteArticleResponse {
  @Field(() => ResponseStatus)
  status!: ResponseStatus;
  @Field(() => DeleteArticleContent, { nullable: true })
  content!: DeleteArticleContent | null;
}

/**
 * AUTH & USER TYPES
 * All types of user/auth will be right here.
 */
@ObjectType()
class UserContent extends SingleContent<User> {
  @Field(() => User, { nullable: true })
  data!: User | null;
}

@ObjectType()
export class UserResponse {
  @Field(() => ResponseStatus)
  status!: ResponseStatus;
  @Field(() => UserContent, { nullable: true })
  content!: UserContent | null;
}

@ObjectType()
class UsersContent extends ListContent<User> {
  @Field(() => [User], { nullable: true })
  data!: User[] | null;
}

@ObjectType()
export class UsersResponse {
  @Field(() => ResponseStatus)
  status!: ResponseStatus;
  @Field(() => UsersContent, { nullable: true })
  content!: UsersContent | null;
}

// Auth types
@ObjectType()
class AuthContent extends SingleContent<User> {
  @Field(() => User, { nullable: true })
  data!: User | null;

  @Field(() => String)
  accessToken!: string;

  @Field(() => String)
  refreshToken?: string;
}

@ObjectType()
export class AuthResponse {
  @Field(() => ResponseStatus, { nullable: true })
  status?: ResponseStatus;

  @Field(() => AuthContent, { nullable: true })
  content!: AuthContent | null;
}

/**
 * Comments
 * All types related to comment, will be defined here.
 */

/** --- List comment content --- */
@ObjectType()
class CommentsContent extends ListContent<Comment> {
  @Field(() => [Comment], { nullable: true })
  data!: Comment[] | null;
}

/** --- List comment response --- */
@ObjectType()
export class CommentsResponse {
  @Field(() => ResponseStatus)
  status!: ResponseStatus;
  @Field(() => CommentsContent, { nullable: true })
  content!: CommentsContent | null;
}

/** --- Single comment content --- */
@ObjectType()
class SingleCommentContent extends SingleContent<Comment> {
  @Field(() => Comment, { nullable: true })
  data!: Comment | null;
}

/** --- Single Comment Response --- */
@ObjectType()
export class CommentResponse {
  @Field(() => ResponseStatus)
  status!: ResponseStatus;
  @Field(() => SingleCommentContent, { nullable: true })
  content!: SingleCommentContent | null;
}

/** --- Create comment content --- */
@ObjectType()
class CreateCommentContent extends SingleContent<Comment> {
  @Field(() => Comment)
  data!: Comment;
}

/** --- Create comment response --- */
@ObjectType()
export class CreateCommentResponse {
  @Field(() => ResponseStatus)
  status!: ResponseStatus;
  @Field(() => CreateCommentContent, { nullable: true })
  content!: CreateCommentContent | null;
}

/** --- Delete Comment Content */
@ObjectType()
class DeleteCommentContent {
  @Field()
  message!: string;
}

/** --- Delete Comment Response */
@ObjectType()
export class DeleteCommentResponse {
  @Field(() => ResponseStatus)
  status!: ResponseStatus;
  @Field(() => DeleteCommentContent, { nullable: true })
  content!: DeleteCommentContent | null;
}

@ObjectType()
export class ArticleSearchResponse {
  @Field(() => [ID])
  id!: number[];
}
