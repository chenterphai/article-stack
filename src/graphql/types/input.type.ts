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

import { ArticleStatus } from '@/entities/article.entities';
import { Gender, Role } from '@/entities/user.entities';
import { Field, ID, InputType, Int } from 'type-graphql';

/**--- Validator --- */
import { MaxLength, IsEmail, Length, IsIn } from 'class-validator';

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

  @Field(() => Int) // Author ID
  authorId!: number;

  @Field(() => ArticleStatus, { defaultValue: ArticleStatus.DRAFT })
  status!: ArticleStatus;
}

/**--- Update Article Input --- */
@InputType()
export class UpdateArticleInput {
  @Field(() => ID)
  id!: string; // Use string for ID in input

  @Field({ nullable: true })
  title?: string;

  @Field(() => String, { nullable: true })
  content?: string;

  @Field(() => String, { nullable: true })
  slug?: string;

  @Field(() => Int, { nullable: true }) // Author ID
  authorId?: number;

  @Field(() => ArticleStatus, { nullable: true }) // Use ArticleStatus enum
  status?: ArticleStatus;
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
  gender!: Gender;

  @Field(() => Role, { defaultValue: Role.USER })
  @IsIn(Object.values(Role))
  role!: Role;
}

/** --- User login input --- */
@InputType()
export class LoginInput {
  @Field()
  usernameOrEmail!: string;

  @Field()
  password!: string;
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

  @Field(() => Int) // Author ID of the comment
  authorId!: number;

  @Field(() => Int) // Article ID the comment belongs to
  articleId!: number;
}

/** --- Update comment input --- */
@InputType()
export class UpdateCommentInput {
  @Field(() => Int)
  id!: number;

  @Field(() => String, { nullable: true })
  content?: string;
}
