import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const startServer = async () => {
  const { url } = await startStandaloneServer(server, {
    context: async () => ({
      prisma,
    }),
    listen: { port: 4000 },
  });
  console.log(`🚀 Server ready at ${url}`);
};

startServer().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
}); 