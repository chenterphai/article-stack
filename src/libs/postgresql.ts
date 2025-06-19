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

// Node Modules
import { DataSource } from 'typeorm';
import path from 'path';

// Custom Modules
import config from '@/config';
import { logger } from '@/libs/winston';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.DATABASE_URL,
  database: 'articlestackdb',
  synchronize: true, // use migrations in production!
  logging: false,
  entities: [path.join(__dirname, '..', 'entities', '**', '*.{ts,js}')],
  migrations: [path.join(__dirname, '..', 'entities', '**', '*.{ts,js}')],
  subscribers: [],
});

export async function connectToDatabase() {
  try {
    await AppDataSource.initialize();
    logger.info(`✅ Connected to PostgreSQL via TypeORM.`);
  } catch (error) {
    logger.error(`❌ Database connection error: `, error);
    process.exit(1);
  }
}

export async function distroyFromDatabase() {
  try {
    await AppDataSource.destroy();
    logger.info(`✅ Distroy from PostgreSQL via TypeORM.`);
  } catch (error) {
    logger.error(`❌ Database distration error: `, error);
    process.exit(1);
  }
}
