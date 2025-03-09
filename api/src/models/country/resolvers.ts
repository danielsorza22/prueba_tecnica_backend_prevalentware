import { Context, PaginationInput, AuthenticationError, AuthorizationError } from '../../types';
import { withSessionCheck } from '../../auth/withSessionCheck';

export const countryResolvers = {
  Query: {
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
      'countries',
      'Query'
    )
  }
}; 