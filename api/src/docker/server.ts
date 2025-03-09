import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
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

const startServer = async () => {
  const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => {
      // Crear el contexto base con prisma y loaders
      const context: Context = { 
        prisma,
        loaders: {
          roleLoader: createRoleLoader(prisma)
        }
      };

      // Extraer el token del header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return context;
      }

      const token = authHeader.split(' ')[1];
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
    listen: { port: process.env.PORT ? parseInt(process.env.PORT) : 4000 },
  });

  console.log(`🚀 Server ready at ${url}`);
};

startServer().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
}); 