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
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entities';
import { Comment } from './comment.entities';
import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';

export enum ArticleStatus {
  DRAFT = 0,
  PUBLISHED = 1,
  ARCHIVED = 2,
}
registerEnumType(ArticleStatus, {
  name: 'ArticleStatus',
  description: 'Article Status',
});

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}
registerEnumType(SortDirection, {
  name: 'SortDirection',
  description: 'Ascending or Descending sort order.',
});

// Specific fields an Article can be sorted by
export enum ArticleSortField {
  CREATION_TIME = 'creationtime', // Maps directly to entity column name
  TITLE = 'title',
  SLUG = 'slug',
  // Add other sortable fields as needed
}
registerEnumType(ArticleSortField, {
  name: 'ArticleSortField',
  description: 'Fields by which articles can be sorted.',
});

@ObjectType()
@Entity({ name: 'fa_articles' })
export class Article {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Field(() => String)
  @Column({ length: 200 })
  title!: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  content!: string;

  @Field(() => String)
  @Column({ unique: true, length: 255 }) // unique and length for slug
  slug!: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.articles, {
    nullable: false, // An article must have an author
    onDelete: 'CASCADE', // If author is deleted, articles are deleted
  })
  author!: User;

  @Field(() => [Comment], { nullable: true })
  @OneToMany(() => Comment, (comment) => comment.article)
  comments?: Comment[]; // An article can have many comments

  @Field(() => ArticleStatus)
  @Column({ type: 'int', default: ArticleStatus.DRAFT, nullable: false }) // Use 'int' for enum value storage
  status!: ArticleStatus;

  @Field(() => String)
  @CreateDateColumn()
  creationtime!: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatetime?: Date;
}
