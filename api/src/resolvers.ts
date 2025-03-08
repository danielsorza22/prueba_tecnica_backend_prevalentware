import { Context, AuthenticationError, AuthorizationError } from './types';
import { withSessionCheck } from './auth/withSessionCheck';

// Middleware para verificar autenticación
const checkAuth = (context: Context) => {
  if (!context.user) {
    throw new AuthenticationError('Must be logged in');
  }
  return context.user;
};

// Middleware para verificar rol de administrador
const checkAdmin = (context: Context) => {
  const user = checkAuth(context);
  if (user.Role?.name !== 'Admin') {
    throw new AuthorizationError('Must be an administrator');
  }
  return user;
};

export const resolvers = {
  Query: {
    // Obtener usuario autenticado
    me: async (_parent: any, _args: any, context: Context) => {
      const user = checkAuth(context);
      return context.prisma.user.findUnique({
        where: { id: user.id },
        include: { Role: true }
      });
    },

    // Obtener todos los usuarios (solo admin)
    users: withSessionCheck(
      async (_parent: any, _args: any, context: Context) => {
        if (!context.user || !context.user.Role) {
          throw new AuthenticationError('User not authenticated');
        }

        const userRole = context.user.Role.name;

        // Configurar los includes según el rol
        const includeFields = {
          Role: true,
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

    // Obtener usuario por ID (solo admin)
    user: async (_parent: any, args: { id: string }, context: Context) => {
      checkAdmin(context);
      return context.prisma.user.findUnique({
        where: { id: args.id },
        include: {
          Role: true,
          Session: true
        }
      });
    },

    // Obtener roles (solo admin)
    roles: async (_parent: any, _args: any, context: Context) => {
      checkAdmin(context);
      return context.prisma.role.findMany({
        include: {
          User: true
        }
      });
    },

    // Obtener sesiones del usuario actual
    sessions: async (_parent: any, _args: any, context: Context) => {
      const user = checkAuth(context);
      return context.prisma.session.findMany({
        where: { userId: user.id },
        include: {
          User: true
        }
      });
    },

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
          Role: true,
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

  Mutation: {
    // Actualizar usuario actual
    updateUser: async (_parent: any, args: any, context: Context) => {
      const user = checkAuth(context);
      return context.prisma.user.update({
        where: { id: user.id },
        data: {
          name: args.name,
          position: args.position,
          updatedAt: new Date()
        },
        include: {
          Role: true,
          Session: true
        }
      });
    },

    // Actualizar rol de usuario (solo admin)
    updateUserRole: async (_parent: any, args: any, context: Context) => {
      checkAdmin(context);
      return context.prisma.user.update({
        where: { id: args.userId },
        data: {
          roleId: args.roleId,
          updatedAt: new Date()
        },
        include: {
          Role: true,
          Session: true
        }
      });
    },

    // Eliminar usuario (solo admin)
    deleteUser: async (_parent: any, args: { id: string }, context: Context) => {
      checkAdmin(context);
      return context.prisma.user.delete({
        where: { id: args.id },
        include: {
          Role: true,
          Session: true
        }
      });
    }
  },

  // Resolvers para los campos relacionados
  User: {
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
      const userRole = context.user?.Role?.name;
      const isOwnUser = context.user?.id === parent.id;

      if (userRole !== 'Admin' && !isOwnUser) {
        return null;
      }

      return context.prisma.userMonitoring.findMany({
        where: {
          userId: parent.id
        }
      });
    }
  }
}; 