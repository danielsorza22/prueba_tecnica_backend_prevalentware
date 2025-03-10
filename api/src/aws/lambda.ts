import { ApolloServer } from '@apollo/server';
import { startServerAndCreateLambdaHandler, handlers } from '@as-integrations/aws-lambda';
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context as LambdaContext } from 'aws-lambda';
import { typeDefs, resolvers } from '../models';
import { Context } from '../types';
import { PrismaClient } from '@prisma/client';
import { createRoleLoader } from '../models/user/dataLoaders';
import { getSession } from '../auth/getSession';

const prisma = new PrismaClient();

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
});

// Create the Lambda handler
export const handler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventV2RequestHandler(),
  {
    context: async ({ event }) => {
      // Create base context with prisma and loaders
      const context: Context = {
        prisma,
        loaders: {
          roleLoader: createRoleLoader(prisma)
        }
      };

      try {
        // Extract token from header
        const token = event.headers?.authorization || '';
        
        if (token) {
          // Get session using getSession function
          const session = await getSession(prisma, token);
          if (session) {
            context.session = session;
            context.user = session.User;
          }
        }
      } catch (error) {
        console.error('Error getting session:', error);
      }

      return context;
    },
  }
); 