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
import { Field, InputType, Int } from 'type-graphql';

// ARTICLES

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

// AUTH & USER

@InputType()
export class RegisterInput {
  @Field(() => String)
  username!: string;

  @Field(() => String)
  email!: string;

  @Field()
  password!: string;

  @Field({ nullable: true })
  nickname?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field(() => Gender, { defaultValue: Gender.OTHER })
  gender!: Gender;

  @Field(() => Role, { defaultValue: Role.USER })
  role!: Role;
}

@InputType()
export class LoginInput {
  @Field()
  usernameOrEmail!: string;

  @Field()
  password!: string;
}
