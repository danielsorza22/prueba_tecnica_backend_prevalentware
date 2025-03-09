import { Context, AuthenticationError, AuthorizationError, AuthenticatedUser } from './types';
import { withSessionCheck } from './auth/withSessionCheck';

// Middleware para verificar autenticación
const checkAuth = (context: Context): AuthenticatedUser => {
  if (!context.user) {
    throw new AuthenticationError('Must be logged in');
  }
  return context.user as AuthenticatedUser;
};

// Middleware para verificar rol de administrador
const checkAdmin = (context: Context): AuthenticatedUser => {
  const user = checkAuth(context);
  if (user.Role?.name !== 'Admin') {
    throw new AuthorizationError('Must be an administrator');
  }
  return user;
};

// Función auxiliar para formatear fechas
const formatDate = (date: Date): string => {
  return date.toISOString().replace('T', ' ').split('.')[0];
};

export const resolvers = {
  Query: {
    // Obtener todos los usuarios
    users: withSessionCheck(
      async (_parent: any, _args: any, context: Context) => {
        if (!context.user || !context.user.Role) {
          throw new AuthenticationError('User not authenticated');
        }

        const userRole = context.user.Role.name;

        // Configurar los includes según el rol
        const includeFields = {
          Country: true,
          ...(userRole === 'Admin' && { UserMonitoring: true })
        };

        // Si es User, solo puede ver sus propios datos
        if (userRole === 'User') {
          return context.prisma.user.findMany({
            where: { 
              id: context.user.id 
            },
            include: includeFields
          });
        }

        // Admin y Manager pueden ver todos los usuarios
        return context.prisma.user.findMany({
          include: includeFields
        });
      },
      'users',
      'Query'
    ),

    // Obtener usuario por email
    userByEmail: withSessionCheck(
      async (_parent: any, args: { email: string }, context: Context) => {
        if (!context.user || !context.user.Role) {
          throw new AuthenticationError('User not authenticated');
        }

        const userRole = context.user.Role.name;
        const isOwnEmail = context.user.email === args.email;

        // Configurar los includes según el rol
        const includeFields = {
          Country: true,
          ...(userRole === 'Admin' && { UserMonitoring: true })
        };

        // Si es User, solo puede ver sus propios datos
        if (userRole === 'User' && !isOwnEmail) {
          throw new AuthorizationError('Cannot view other users data');
        }

        const user = await context.prisma.user.findUnique({
          where: { 
            email: args.email 
          },
          include: includeFields
        });

        if (!user) {
          throw new Error('User not found');
        }

        return user;
      },
      'userByEmail',
      'Query'
    ),

    // Obtener todos los países (solo Admin y Manager)
    countries: withSessionCheck(
      async (_parent: any, _args: any, context: Context) => {
        if (!context.user || !context.user.Role) {
          throw new AuthenticationError('User not authenticated');
        }

        const userRole = context.user.Role.name;

        // Solo Admin y Manager pueden ver los países
        if (userRole === 'User') {
          throw new AuthorizationError('Insufficient permissions to view countries');
        }

        return context.prisma.country.findMany({
          include: {
            User: true
          }
        });
      },
      'countries',
      'Query'
    ),

    // Obtener monitoreo de usuario por rango de fechas
    userMonitoringByDate: withSessionCheck(
      async (_parent: any, args: { email: string; startDate: string; endDate: string }, context: Context) => {
        if (!context.user || !context.user.Role) {
          throw new AuthenticationError('User not authenticated');
        }

        const userRole = context.user.Role.name;
        const isOwnEmail = context.user.email === args.email;

        // Verificar permisos: solo Admin puede ver cualquier usuario, User solo puede ver sus propios datos
        if (userRole === 'User' && !isOwnEmail) {
          throw new AuthorizationError('Cannot view other users monitoring data');
        }

        if (userRole === 'Manager') {
          throw new AuthorizationError('Managers cannot access monitoring data');
        }

        // Buscar el usuario por email
        const targetUser = await context.prisma.user.findUnique({
          where: { email: args.email }
        });

        if (!targetUser) {
          throw new Error('User not found');
        }

        // Convertir fechas string a Date
        const startDate = new Date(args.startDate);
        const endDate = new Date(args.endDate);

        // Validar fechas
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date format');
        }

        // Buscar registros de monitoreo en el rango de fechas
        const monitoringData = await context.prisma.userMonitoring.findMany({
          where: {
            userId: targetUser.id,
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            User: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Formatear las fechas antes de retornar
        return monitoringData.map(record => ({
          ...record,
          createdAt: formatDate(record.createdAt)
        }));
      },
      'userMonitoringByDate',
      'Query'
    ),

    // Obtener top 3 usuarios con más registros de monitoreo
    topUsersWithMonitoring: withSessionCheck(
      async (_parent: any, args: { startDate: string; endDate: string }, context: Context) => {
        if (!context.user || !context.user.Role) {
          throw new AuthenticationError('User not authenticated');
        }

        // Solo administradores pueden acceder a esta información
        if (context.user.Role.name !== 'Admin') {
          throw new AuthorizationError('Only administrators can access this information');
        }

        // Convertir fechas string a Date
        const startDate = new Date(args.startDate);
        const endDate = new Date(args.endDate);

        // Validar fechas
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date format');
        }

        // Obtener usuarios con conteo de registros de monitoreo
        const usersWithMonitoring = await context.prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            position: true,
            createdAt: true,
            updatedAt: true,
            roleId: true,
            Role: true,
            _count: {
              select: {
                UserMonitoring: {
                  where: {
                    createdAt: {
                      gte: startDate,
                      lte: endDate
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            UserMonitoring: {
              _count: 'desc'
            }
          },
          take: 3
        });

        // Formatear la respuesta
        return usersWithMonitoring.map(user => ({
          user: {
            ...user,
            createdAt: formatDate(user.createdAt),
            updatedAt: formatDate(user.updatedAt)
          },
          monitoringCount: user._count.UserMonitoring
        }));
      },
      'topUsersWithMonitoring',
      'Query'
    ),

    // Obtener top 3 usuarios por tipo de monitoreo y país
    topUsersByTypeAndCountry: withSessionCheck(
      async (_parent: any, args: { 
        monitoringType: 'signIn' | 'print' | 'share';
        countryId: string;
        startDate: string;
        endDate: string;
      }, context: Context) => {
        if (!context.user || !context.user.Role) {
          throw new AuthenticationError('User not authenticated');
        }

        // Solo administradores pueden acceder a esta información
        if (context.user.Role.name !== 'Admin') {
          throw new AuthorizationError('Only administrators can access this information');
        }

        // Convertir fechas string a Date
        const startDate = new Date(args.startDate);
        const endDate = new Date(args.endDate);

        // Validar fechas
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date format');
        }

        // Verificar que el país existe
        const country = await context.prisma.country.findUnique({
          where: { id: args.countryId }
        });

        if (!country) {
          throw new Error('Country not found');
        }

        // Obtener usuarios con conteo de registros de monitoreo específico
        const usersWithMonitoring = await context.prisma.user.findMany({
          where: {
            Country: {
              some: {
                id: args.countryId
              }
            }
          },
          select: {
            id: true,
            email: true,
            name: true,
            position: true,
            createdAt: true,
            updatedAt: true,
            roleId: true,
            Role: true,
            _count: {
              select: {
                UserMonitoring: {
                  where: {
                    description: args.monitoringType,
                    createdAt: {
                      gte: startDate,
                      lte: endDate
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            UserMonitoring: {
              _count: 'desc'
            }
          },
          take: 3
        });

        // Formatear la respuesta
        return usersWithMonitoring.map(user => ({
          user: {
            ...user,
            createdAt: formatDate(user.createdAt),
            updatedAt: formatDate(user.updatedAt)
          },
          monitoringCount: user._count.UserMonitoring
        }));
      },
      'topUsersByTypeAndCountry',
      'Query'
    )
  },

  // Resolvers para los campos relacionados
  User: {
    // Resolver para el campo role usando DataLoader
    role: async (parent: any, _args: any, context: Context) => {
      if (!parent.roleId || !context.loaders?.roleLoader) return null;
      return context.loaders.roleLoader.load(parent.roleId);
    },

    // Resolver para el campo countries
    countries: async (parent: any, _args: any, context: Context) => {
      return context.prisma.country.findMany({
        where: {
          User: {
            some: {
              id: parent.id
            }
          }
        }
      });
    },

    // Resolver para el campo monitoring (solo disponible para Admin y el propio usuario)
    monitoring: async (parent: any, _args: any, context: Context) => {
      const user = context.user as AuthenticatedUser;
      const userRole = user?.Role?.name;
      const isOwnUser = user?.id === parent.id;

      if (userRole !== 'Admin' && !isOwnUser) {
        return [];
      }

      const monitoring = await context.prisma.userMonitoring.findMany({
        where: {
          userId: parent.id
        }
      });

      return monitoring || [];
    }
  }
}; 