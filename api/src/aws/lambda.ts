import { ApolloServer } from '@apollo/server';
import { startServerAndCreateLambdaHandler, handlers } from '@as-integrations/aws-lambda';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
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

// Crear el handler para Lambda
export const handler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventV2RequestHandler(),
  {
    context: async ({ event }) => {
      // Crear el contexto base con prisma y loaders
      const context: Context = {
        prisma,
        loaders: {
          roleLoader: createRoleLoader(prisma)
        }
      };

      // Extraer el token del header
      const token = event.headers?.authorization || '';
      if (!token) {
        return context;
      }

      try {
        // Obtener la sesión usando la función getSession
        const session = await getSession(prisma, token);
        if (session) {
          context.session = session;
          context.user = session.User;
        }
      } catch (error) {
        console.error('Error getting session:', error);
      }

      return context;
    },
  }
); 