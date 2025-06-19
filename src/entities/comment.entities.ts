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
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entities';
import { Article } from './article.entities';
import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType()
@Entity({ name: 'fa_comments' }) // Best practice: snake_case and plural
export class Comment extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: 'bigint' }) // Best practice: bigint for primary keys
  id!: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: false }) // 'text' for comment content, not nullable
  content!: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.comments, {
    nullable: false, // A comment must have an author
    onDelete: 'CASCADE', // If author is deleted, comments are deleted
  })
  author!: User;

  @Field(() => Article)
  @ManyToOne(() => Article, (article) => article.comments, {
    nullable: false, // A comment must be on an article
    onDelete: 'CASCADE', // If article is deleted, comments are deleted
  })
  article!: Article;

  @Field(() => String)
  @CreateDateColumn()
  creationtime!: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatetime?: Date;
}
