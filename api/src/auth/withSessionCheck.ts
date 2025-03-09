import { Context } from '../types';
import { checkSession } from './checkSession';
import { AuthorizationError } from '../types';
import { AuthenticationError } from '../types';

type ResolverFunction = (parent: any, args: any, context: Context) => Promise<any>;

export const withSessionCheck = (
  resolver: ResolverFunction,
  resolverName: string,
  resolverType: 'Query'
) => {
  return async (parent: any, args: any, context: Context) => {
    try {
      // Verificar la sesión y permisos
      const check = await checkSession({
        session: context.session || null,
        resolverName,
        resolverType,
        args
      });

      // Si hay un error en la verificación, lanzarlo
      if (check instanceof Error) {
        throw check;
      }

      // Si pasa la verificación, ejecutar el resolver
      return resolver(parent, args, context);
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
