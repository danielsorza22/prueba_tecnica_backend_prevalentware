import { Context } from '../types';
import { checkSession } from './checkSession';
import { AuthorizationError } from '../types';
import { AuthenticationError } from '../types';

type ResolverFunction = (parent: any, args: any, context: Context) => Promise<any>;

export const withSessionCheck = (
  resolver: ResolverFunction,
  resolverName: string,
  resolverType: 'Query' | 'Mutation'
) => {
  return async (parent: unknown, args: unknown, context: Context) => {
    try {
      // Verificar permisos
      const check = await checkSession({
        session: context.session,
        resolverName,
        resolverType,
        args
      });

      // Si la verificación pasa, ejecutar el resolver
      if (check.auth) {
        return resolver(parent, args, context);
      }

      throw new AuthorizationError('Unauthorized operation');
    } catch (error) {
      // Re-lanzar errores de autenticación/autorización
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        throw error;
      }
      // Para otros errores, lanzar error de autorización genérico
      throw new AuthorizationError('Authorization check failed');
    }
  };
};
