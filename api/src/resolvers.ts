import { Context, AuthenticationError, AuthorizationError, AuthenticatedUser, PaginationInput, PaginatedResponse } from './types';
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

// Función auxiliar para manejar la paginación
const handlePagination = <T>(
  items: T[],
  totalCount: number,
  { page = 1, pageSize = 10 }: PaginationInput
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(totalCount / pageSize);
  
  return {
    items,
    pageInfo: {
      totalCount,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      currentPage: page,
      totalPages
    }
  };
};

export const resolvers = {
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

          return handlePagination(items, totalCount, { page, pageSize });
        }

        // Admin y Manager pueden ver todos los usuarios
        const totalCount = await context.prisma.user.count();
        const items = await context.prisma.user.findMany({
          include: includeFields,
          skip,
          take: pageSize
        });

        return handlePagination(items, totalCount, { page, pageSize });
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
      async (_parent: any, args: { pagination?: PaginationInput }, context: Context) => {
        if (!context.user || !context.user.Role) {
          throw new AuthenticationError('User not authenticated');
        }

        const { page = 1, pageSize = 10 } = args.pagination || {};
        const skip = (page - 1) * pageSize;
        const userRole = context.user.Role.name;

        // Solo Admin y Manager pueden ver los países
        if (userRole === 'User') {
          throw new AuthorizationError('Insufficient permissions to view countries');
        }

        const totalCount = await context.prisma.country.count();
        const items = await context.prisma.country.findMany({
          include: { User: true },
          skip,
          take: pageSize
        });

        return handlePagination(items, totalCount, { page, pageSize });
      },
      'countries',
      'Query'
    ),

    // Obtener monitoreo de usuario por rango de fechas
    userMonitoringByDate: withSessionCheck(
      async (_parent: any, args: { 
        email: string; 
        startDate: string; 
        endDate: string;
        pagination?: PaginationInput;
      }, context: Context) => {
        if (!context.user || !context.user.Role) {
          throw new AuthenticationError('User not authenticated');
        }

        const { page = 1, pageSize = 10 } = args.pagination || {};
        const skip = (page - 1) * pageSize;
        const userRole = context.user.Role.name;
        const isOwnEmail = context.user.email === args.email;

        if (userRole === 'User' && !isOwnEmail) {
          throw new AuthorizationError('Cannot view other users monitoring data');
        }

        if (userRole === 'Manager') {
          throw new AuthorizationError('Managers cannot access monitoring data');
        }

        const targetUser = await context.prisma.user.findUnique({
          where: { email: args.email }
        });

        if (!targetUser) {
          throw new Error('User not found');
        }

        const startDate = new Date(args.startDate);
        const endDate = new Date(args.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date format');
        }

        const where = {
          userId: targetUser.id,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        };

        const totalCount = await context.prisma.userMonitoring.count({ where });
        const items = await context.prisma.userMonitoring.findMany({
          where,
          include: { User: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        });

        const formattedItems = items.map(record => ({
          ...record,
          createdAt: formatDate(record.createdAt)
        }));

        return handlePagination(formattedItems, totalCount, { page, pageSize });
      },
      'userMonitoringByDate',
      'Query'
    ),

    // Obtener top usuarios con más registros de monitoreo
    topUsersWithMonitoring: withSessionCheck(
      async (_parent: any, args: { 
        startDate: string; 
        endDate: string;
        pagination?: PaginationInput;
      }, context: Context) => {
        if (!context.user || !context.user.Role) {
          throw new AuthenticationError('User not authenticated');
        }

        if (context.user.Role.name !== 'Admin') {
          throw new AuthorizationError('Only administrators can access this information');
        }

        const { page = 1, pageSize = 10 } = args.pagination || {};
        const skip = (page - 1) * pageSize;
        const startDate = new Date(args.startDate);
        const endDate = new Date(args.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date format');
        }

        const usersWithCount = await context.prisma.user.findMany({
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
          skip,
          take: pageSize
        });

        const totalCount = await context.prisma.user.count({
          where: {
            UserMonitoring: {
              some: {
                createdAt: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          }
        });

        const items = usersWithCount.map(user => ({
          user: {
            ...user,
            createdAt: formatDate(user.createdAt),
            updatedAt: formatDate(user.updatedAt)
          },
          monitoringCount: user._count.UserMonitoring
        }));

        return handlePagination(items, totalCount, { page, pageSize });
      },
      'topUsersWithMonitoring',
      'Query'
    ),

    // Obtener top usuarios por tipo de monitoreo y país
    topUsersByTypeAndCountry: withSessionCheck(
      async (_parent: any, args: { 
        monitoringType: 'signIn' | 'print' | 'share';
        countryId: string;
        startDate: string;
        endDate: string;
        pagination?: PaginationInput;
      }, context: Context) => {
        if (!context.user || !context.user.Role) {
          throw new AuthenticationError('User not authenticated');
        }

        if (context.user.Role.name !== 'Admin') {
          throw new AuthorizationError('Only administrators can access this information');
        }

        const { page = 1, pageSize = 10 } = args.pagination || {};
        const startDate = new Date(args.startDate);
        const endDate = new Date(args.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date format');
        }

        const offset = (page - 1) * pageSize;
        
        // Consulta SQL modificada para incluir paginación
        const rawQuery = `
          WITH UserCounts AS (
            SELECT 
              u.id,
              u.email,
              u.name,
              u.position,
              u."createdAt",
              u."updatedAt",
              u."roleId",
              r.name as role_name,
              COUNT(um.id) as monitoring_count
            FROM "User" u
            INNER JOIN "_CountryToUser" cu ON u.id = cu."B"
            INNER JOIN "Role" r ON u."roleId" = r.id
            LEFT JOIN "UserMonitoring" um ON u.id = um."userId"
            WHERE 
              cu."A" = $1
              AND um.description = $2
              AND um."createdAt" >= $3
              AND um."createdAt" <= $4
            GROUP BY 
              u.id, u.email, u.name, u.position, 
              u."createdAt", u."updatedAt", u."roleId", r.name
            ORDER BY monitoring_count DESC
            OFFSET $5
            LIMIT $6
          )
          SELECT 
            id, 
            email, 
            name, 
            position, 
            "createdAt", 
            "updatedAt",
            "roleId", 
            role_name,
            monitoring_count
          FROM UserCounts
          WHERE monitoring_count > 0;
        `;

        // Consulta para obtener el total de registros
        const countQuery = `
          SELECT COUNT(*) as total
          FROM (
            SELECT u.id
            FROM "User" u
            INNER JOIN "_CountryToUser" cu ON u.id = cu."B"
            LEFT JOIN "UserMonitoring" um ON u.id = um."userId"
            WHERE 
              cu."A" = $1
              AND um.description = $2
              AND um."createdAt" >= $3
              AND um."createdAt" <= $4
            GROUP BY u.id
            HAVING COUNT(um.id) > 0
          ) as subquery;
        `;

        try {
          const [results, countResult] = await Promise.all([
            context.prisma.$queryRawUnsafe<Array<{
              id: string;
              email: string;
              name: string | null;
              position: string | null;
              createdAt: Date;
              updatedAt: Date;
              roleId: string | null;
              role_name: string;
              monitoring_count: string;
            }>>(rawQuery, args.countryId, args.monitoringType, startDate, endDate, offset, pageSize),
            context.prisma.$queryRawUnsafe<[{ total: number }]>(countQuery, args.countryId, args.monitoringType, startDate, endDate)
          ]);

          const items = results.map(row => ({
            user: {
              id: row.id,
              email: row.email,
              name: row.name,
              position: row.position,
              createdAt: formatDate(row.createdAt),
              updatedAt: formatDate(row.updatedAt),
              roleId: row.roleId,
              Role: {
                name: row.role_name
              }
            },
            monitoringCount: parseInt(row.monitoring_count)
          }));

          const totalCount = Number(countResult[0].total);

          return handlePagination(items, totalCount, { page, pageSize });
        } catch (error) {
          console.error('Error en la consulta SQL:', error);
          throw error;
        }
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