import { PrismaClient, User, Role, Session } from '@prisma/client';
import DataLoader from 'dataloader';

// Tipo para el usuario autenticado con su rol
export interface AuthenticatedUser extends User {
  Role: Role | null;
}

// Tipo para la sesión con el usuario incluido
export interface AuthenticatedSession extends Session {
  User: AuthenticatedUser;
}

// Contexto disponible en todos los resolvers
export interface Context {
  prisma: PrismaClient;
  user?: AuthenticatedUser | null;
  session?: AuthenticatedSession | null;
  loaders?: {
    roleLoader: DataLoader<string, Role | null>;
  };
}

// Error personalizado para autenticación
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Error personalizado para autorización
export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
} 