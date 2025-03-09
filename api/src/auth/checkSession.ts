import { verifyResolver } from './verifyResolver';
import { AuthenticationError, AuthorizationError, AuthenticatedSession } from '../types';
import { Context } from '../types';

interface CheckSessionParams {
  session: AuthenticatedSession | null;
  resolverName: string;
  resolverType: 'Query';
  args?: any;
}

export const checkSession = async ({ session, resolverName, resolverType, args }: CheckSessionParams) => {
  // 1. Verificar configuración del resolver
  const res = verifyResolver(resolverName, resolverType);
  if (!res) {
    throw new AuthorizationError('Resolver not configured');
  }

  // 2. Si es público, permitir acceso
  if (res.isPublic) {
    return { auth: true };
  }

  // 3. Verificar sesión
  if (!session?.User) {
    throw new AuthenticationError('Authentication required');
  }

  const userRole = session.User.Role?.name;
  if (!userRole) {
    throw new AuthorizationError('User role not found');
  }

  // 4. Verificar permisos básicos del rol
  if (!res.roles.includes(userRole)) {
    throw new AuthorizationError('Insufficient permissions');
  }

  // 5. Verificaciones específicas por rol
  if (userRole === 'User') {
    // Users solo pueden ver sus propios datos
    if (['user', 'userMonitoring'].includes(resolverName) && args?.id !== session.User.id) {
      throw new AuthorizationError('Users can only access their own data');
    }
  } else if (userRole === 'Manager') {
    // Managers no pueden acceder a UserMonitoring
    if (resolverName === 'userMonitoring') {
      throw new AuthorizationError('Managers cannot access monitoring data');
    }
  }
  // Admin tiene acceso completo, no necesita verificaciones adicionales

  return { auth: true };
};
