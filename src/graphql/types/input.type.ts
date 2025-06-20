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
  ArticleSortField,
  ArticleStatus,
  SortDirection,
} from '@/entities/article.entities';
import { Gender, Role } from '@/entities/user.entities';
import { Field, InputType, Int } from 'type-graphql';

/**--- Validator --- */
import { IsEmail, Length, IsIn } from 'class-validator';

/**
 * ARTICLE
 * All input types for article will be defined here
 */

/**--- Create Article Input --- */
@InputType()
export class CreateArticleInput {
  @Field()
  title!: string;

  @Field(() => String)
  content!: string;

  @Field(() => String)
  slug!: string;

  @Field(() => ArticleStatus, { defaultValue: ArticleStatus.PUBLISHED })
  status!: ArticleStatus;
}

/**--- Update Article Input --- */
@InputType()
export class UpdateArticleInput {
  @Field({ nullable: true })
  title?: string;

  @Field(() => String, { nullable: true })
  content?: string;

  @Field(() => String, { nullable: true })
  slug?: string;

  @Field(() => ArticleStatus, { nullable: true }) // Use ArticleStatus enum
  status?: ArticleStatus;
}

/** --- Sort Article */
@InputType()
export class ArticleSortInput {
  @Field(() => ArticleSortField, {
    defaultValue: ArticleSortField.CREATION_TIME,
  })
  field!: ArticleSortField;

  @Field(() => SortDirection, { defaultValue: SortDirection.DESC })
  direction!: SortDirection;
}

/** --- END OF ARTICLE --- */

/**
 * AUTH & USER
 * All input types of user entity will be defined below
 */

/** --- User registration input --- */
@InputType()
export class RegisterInput {
  @Field(() => String)
  username!: string;

  @Field(() => String)
  @IsEmail()
  email!: string;

  @Field()
  @Length(4)
  password!: string;

  @Field({ nullable: true })
  nickname?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field(() => Gender, { defaultValue: Gender.OTHER })
  @IsIn(Object.values(Gender))
  gender?: Gender;

  @Field(() => Role, { defaultValue: Role.USER })
  @IsIn(Object.values(Role))
  role?: Role;
}

/** --- User login input --- */
@InputType()
export class LoginInput {
  @Field()
  usernameOrEmail!: string;

  @Field()
  password!: string;
}

/** --- Update User Input --- */
@InputType()
export class UpdateProfileInput {
  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  nickname?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field({ nullable: true })
  @IsEmail()
  email?: string;

  @Field({ nullable: true })
  gender?: Gender;

  @Field(() => Date, { nullable: true })
  updatetime?: Date;
}

/** --- END OF AUTH & USER --- */

/**
 * Comment
 * All input types of comment will be defined here
 */

/**--- Create comment input --- */
@InputType()
export class CreateCommentInput {
  @Field(() => String)
  content!: string;

  @Field(() => Int) // Article ID the comment belongs to
  articleId!: number;
}

/** --- Update comment input --- */
@InputType()
export class UpdateCommentInput {
  @Field(() => String, { nullable: true })
  content?: string;
}
