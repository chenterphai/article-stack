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
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entities';
import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType()
@Entity({ name: 'fa_token' })
export class Token extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @Column({ unique: true })
  token!: string;

  @Field(() => User)
  @OneToOne(() => User, (user) => user.token, { nullable: false })
  @JoinColumn()
  user!: User;

  @Field(() => String)
  @Column({ type: 'timestamp', nullable: true })
  expiresAt!: Date | null;

  @Field(() => Boolean)
  @Column({ default: false })
  isRevoked!: boolean;

  @Field(() => String)
  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  creationtime!: Date;

  @Field(() => String)
  @Column({ default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatetime!: Date;
}
