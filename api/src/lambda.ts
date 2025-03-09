import { ApolloServer } from '@apollo/server';
import { startServerAndCreateLambdaHandler, handlers } from '@as-integrations/aws-lambda';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { typeDefs } from './type';
import { resolvers } from './resolvers';
import { Context } from './types';
import { PrismaClient } from '@prisma/client';

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
      // Aquí puedes extraer el token de autenticación del evento si lo necesitas
      const token = event.headers?.authorization || '';
      
      // Crear el contexto con Prisma y la información de autenticación
      return {
        prisma,
        user: null, // Aquí implementarías la lógica de autenticación
        session: null, // Aquí implementarías la lógica de sesión
      };
    },
  }
); 