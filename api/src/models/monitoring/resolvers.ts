import { Context, PaginationInput, AuthenticationError, AuthorizationError } from '../../types';
import { withSessionCheck } from '../../auth/withSessionCheck';

// Función auxiliar para formatear fechas
const formatDate = (date: Date): string => {
  return date.toISOString().replace('T', ' ').split('.')[0];
};

export const monitoringResolvers = {
  Query: {
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
          include: { 
            User: {
              include: {
                Role: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: pageSize
        });

        const formattedItems = items.map(record => ({
          ...record,
          createdAt: formatDate(record.createdAt),
          user: record.User // Aseguramos que el campo user esté presente
        }));

        return {
          items: formattedItems,
          pageInfo: {
            totalCount,
            hasNextPage: page < Math.ceil(totalCount / pageSize),
            hasPreviousPage: page > 1,
            currentPage: page,
            totalPages: Math.ceil(totalCount / pageSize)
          }
        };
      },
      'userMonitoringByDate',
      'Query'
    ),

    // Obtener top usuarios con más registros de monitoreo
    topUsersWithMonitoring: withSessionCheck(
      async (_parent: any, args: { 
        startDate: string; 
        endDate: string;
      }, context: Context) => {
        if (!context.user || !context.user.Role) {
          throw new AuthenticationError('User not authenticated');
        }

        if (context.user.Role.name !== 'Admin') {
          throw new AuthorizationError('Only administrators can access this information');
        }

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
            UserMonitoring: {
              where: {
                createdAt: {
                  gte: startDate,
                  lte: endDate
                }
              },
              select: {
                id: true,
                description: true,
                createdAt: true
              }
            },
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

        return usersWithCount.map(user => ({
          user: {
            ...user,
            monitoring: user.UserMonitoring,
            createdAt: user.createdAt instanceof Date ? formatDate(user.createdAt) : user.createdAt,
            updatedAt: user.updatedAt instanceof Date ? formatDate(user.updatedAt) : user.updatedAt
          },
          monitoringCount: user._count.UserMonitoring
        }));
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
      }, context: Context) => {
        if (!context.user || !context.user.Role) {
          throw new AuthenticationError('User not authenticated');
        }

        if (context.user.Role.name !== 'Admin') {
          throw new AuthorizationError('Only administrators can access this information');
        }

        const startDate = new Date(args.startDate);
        const endDate = new Date(args.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date format');
        }
        
        // Consulta SQL optimizada para obtener top 3
        const query = `
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
          HAVING COUNT(um.id) > 0
          ORDER BY monitoring_count DESC
          LIMIT 3;
        `;

        try {
          const results = await context.prisma.$queryRawUnsafe<Array<{
            id: string;
            email: string;
            name: string | null;
            position: string | null;
            createdAt: Date;
            updatedAt: Date;
            roleId: string | null;
            role_name: string;
            monitoring_count: string;
          }>>(query, args.countryId, args.monitoringType, startDate, endDate);

          return results.map(row => ({
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
        } catch (error) {
          console.error('Error en la consulta SQL:', error);
          throw error;
        }
      },
      'topUsersByTypeAndCountry',
      'Query'
    )
  }
}; 