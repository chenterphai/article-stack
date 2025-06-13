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
import { User } from '@/entities/user.entities';
import { Field, Int, ObjectType } from 'type-graphql';

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
export class ArticlesResponse {
  @Field(() => ResponseStatus)
  status!: ResponseStatus;

  @Field(() => ArticlesContent, { nullable: true })
  content!: ArticlesContent | null;
}

// Create
@ObjectType()
export class CreateArticleContent extends SingleContent<Article> {
  @Field(() => Article)
  data!: Article;
}

@ObjectType()
export class CreateArticleResponse {
  @Field(() => ResponseStatus)
  status!: ResponseStatus;

  @Field(() => CreateArticleContent, { nullable: true })
  content!: CreateArticleContent | null;
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
}

@ObjectType()
export class AuthResponse {
  @Field(() => ResponseStatus)
  status!: ResponseStatus;

  @Field(() => AuthContent, { nullable: true })
  content!: AuthContent | null;
}
