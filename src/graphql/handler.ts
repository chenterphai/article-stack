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

import { logger } from '@/libs/winston';
import { loadFilesSync } from '@graphql-tools/load-files';
import path from 'path';

type TypeGraphQLResolverClass = new (...args: any[]) => any;

let loadedResolvers: TypeGraphQLResolverClass[] = [];

try {
  // Dynamically load all resolver files
  const resolverModules = loadFilesSync(path.join(__dirname, './resolvers'), {
    extensions: ['ts', 'js'],
    requireMethod: require,
  });

  resolverModules.forEach((module) => {
    for (const key in module) {
      if (
        typeof module[key] === 'function' &&
        module[key].prototype &&
        module[key].prototype.constructor === module[key]
      ) {
        loadedResolvers.push(module[key] as TypeGraphQLResolverClass);
      }
    }
  });
} catch (error) {
  logger.error('Error loading GraphQL resolver files:', error);
  process.exit(1);
}

export const resolvers = loadedResolvers as Function[];
