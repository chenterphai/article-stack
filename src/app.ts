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
import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { buildSchema } from 'type-graphql';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';

// Custom Modules
import config from '@/config';
import { logger } from '@/libs/winston';
import limiter from '@/libs/limiter';
import corsOptions from '@/libs/cors';
import { resolvers } from '@/graphql/handler';
import { GraphQLContext } from '@/@types/context';
import { connectToDatabase } from './libs/postgresql';
import { customAuthChecker } from './middleware/authenticate';
// import esClient from './libs/elasticsearch';

const app = express();

(async () => {
  try {
    // Database Initialization
    await connectToDatabase();

    // CORS
    app.use(cors<cors.CorsRequest>(corsOptions));

    // Rate limiting
    app.use(limiter);

    // Helmet
    app.use(helmet());

    // Cookies Parser
    app.use(cookieParser());

    // Compression: Enable Response Compression to reduce payload size and improve performance
    app.use(
      compression({
        threshold: 1024, // Only compress responses larger than 1KB
      }),
    );

    // Enable JSON Body
    app.use(express.json());

    // GraphQL Schema and Server
    const schema = await buildSchema({
      resolvers: resolvers as [Function, ...Function[]],
      validate: true,
      authChecker: customAuthChecker,
    });

    const server = new ApolloServer<GraphQLContext>({ schema });

    await server.start();

    app.use(
      '/api/v1',
      expressMiddleware(server, {
        context: async ({ req, res }) => ({
          token: req.headers.token,
          req,
          res,
        }),
      }),
    );

    // const esClientInfo = await esClient.info();

    app.listen(config.PORT, () => {
      // logger.info(esClientInfo);
      logger.info(`Server running on http://localhost:${config.PORT}/api/v1`);
    });
  } catch (error) {
    logger.error(error);

    if (config.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
})();
