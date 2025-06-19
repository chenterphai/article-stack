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
    // Use requireMethod: require for CommonJS modules
    requireMethod: require,
    // ignoreIndex: true // Optional: ignore index.ts/js if you want to explicitly import it
  });

  // Iterate through each loaded module and extract the resolver classes
  // TypeGraphQL resolvers are typically exported as named classes.
  resolverModules.forEach((module) => {
    // A module might export multiple things, iterate over its properties
    for (const key in module) {
      // Check if the exported value is a class (a constructor function)
      // and if it's decorated as a TypeGraphQL Resolver (though we can't check that directly here)
      // The best way to identify them is by convention or simply collecting all exported classes.
      if (
        typeof module[key] === 'function' &&
        module[key].prototype &&
        module[key].prototype.constructor === module[key]
      ) {
        // You might add more specific checks if needed, e.g., if it has a @Resolver metadata
        loadedResolvers.push(module[key] as TypeGraphQLResolverClass);
      }
    }
  });
} catch (error) {
  logger.error('Error loading GraphQL resolver files:', error);
  // Depending on your error handling strategy, you might want to re-throw or exit
  process.exit(1);
}

// Export the array of collected resolver classes
export const resolvers = loadedResolvers as Function[];
