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
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Article } from './article.entities';
import { Comment } from './comment.entities';
import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

registerEnumType(Gender, {
  name: 'Gender',
  description: 'The gender of the user.',
});

export enum Role {
  ADMIN = 'admin',
  USER = 'user',
}
registerEnumType(Role, {
  name: 'Role',
  description: 'The role of the users',
});

@ObjectType()
@Entity({ name: 'fa_users' })
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Field({ nullable: true })
  @Column({ nullable: true, unique: true, length: 20 })
  username!: string;

  @Field()
  @Column({ length: 50, unique: true })
  email!: string;

  @Column()
  password!: string;

  @Field({ nullable: true })
  @Column({ length: 50, nullable: true })
  nickname!: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  avatar!: string;

  @Field(() => Gender)
  @Column({
    type: 'enum',
    enum: Gender,
    default: Gender.OTHER,
    nullable: false,
  })
  gender!: Gender;

  @Field(() => Role)
  @Column({ type: 'text', default: Role.USER, nullable: false })
  role!: Role;

  @Field(() => [Article])
  @OneToMany(() => Article, (article) => article.author)
  articles!: Article[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments!: Comment[];

  @Field(() => String)
  @CreateDateColumn()
  creationtime!: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatetime?: Date;
}
