import { PrismaClient } from '@prisma/client';
import { AuthenticationError, AuthenticatedSession } from '../types';

export const getSession = async (
  prisma: PrismaClient,
  sessionToken?: string
): Promise<AuthenticatedSession | null> => {
  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { 
      sessionToken 
    },
    include: {
      User: {
        include: {
          Role: true
        }
      }
    }
  });

  if (!session) {
    throw new AuthenticationError('Session not found');
  }

  return session as AuthenticatedSession;
};
