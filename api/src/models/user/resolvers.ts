import { Context, AuthenticatedUser, PaginationInput, AuthenticationError, AuthorizationError } from '../../types';
import { withSessionCheck } from '../../auth/withSessionCheck';

// Función auxiliar para formatear fechas
const formatDate = (date: Date | null): string | null => {
  if (!date) return null;
  return date.toISOString();
};

export const userResolvers = {
  Query: {
    // Obtener todos los usuarios
    users: withSessionCheck(
      async (_parent: any, args: { pagination?: PaginationInput }, context: Context) => {
        if (!context.user || !context.user.Role) {
          throw new AuthenticationError('User not authenticated');
        }

        const { page = 1, pageSize = 10 } = args.pagination || {};
        const skip = (page - 1) * pageSize;
        const userRole = context.user.Role.name;

        // Configurar los includes según el rol
        const includeFields = {
          Country: true,
          ...(userRole === 'Admin' && { UserMonitoring: true })
        };

        // Si es User, solo puede ver sus propios datos
        if (userRole === 'User') {
          const totalCount = await context.prisma.user.count({
            where: { id: context.user.id }
          });

          const items = await context.prisma.user.findMany({
            where: { id: context.user.id },
            include: includeFields,
            skip,
            take: pageSize
          });

          return {
            items,
            pageInfo: {
              totalCount,
              hasNextPage: page < Math.ceil(totalCount / pageSize),
              hasPreviousPage: page > 1,
              currentPage: page,
              totalPages: Math.ceil(totalCount / pageSize)
            }
          };
        }

        // Admin y Manager pueden ver todos los usuarios
        const totalCount = await context.prisma.user.count();
        const items = await context.prisma.user.findMany({
          include: includeFields,
          skip,
          take: pageSize
        });

        return {
          items,
          pageInfo: {
            totalCount,
            hasNextPage: page < Math.ceil(totalCount / pageSize),
            hasPreviousPage: page > 1,
            currentPage: page,
            totalPages: Math.ceil(totalCount / pageSize)
          }
        };
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
    )
  },

  User: {
    // Resolver para el campo role usando DataLoader
    role: async (parent: any, _args: any, context: Context) => {
      if (!parent.roleId || !context.loaders?.roleLoader) return null;
      return context.loaders.roleLoader.load(parent.roleId);
    },

    // Formatear campos de fecha
    createdAt: (parent: any) => {
      if (typeof parent.createdAt === 'string') return parent.createdAt;
      return formatDate(parent.createdAt);
    },
    updatedAt: (parent: any) => {
      if (typeof parent.updatedAt === 'string') return parent.updatedAt;
      return formatDate(parent.updatedAt);
    },
    lastLogin: (parent: any) => {
      if (typeof parent.lastLogin === 'string') return parent.lastLogin;
      return formatDate(parent.lastLogin);
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

    // Resolver para el campo monitoring
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

      // Formatear las fechas en los registros de monitoreo
      return monitoring.map(record => ({
        ...record,
        createdAt: formatDate(record.createdAt)
      }));
    }
  }
}; 